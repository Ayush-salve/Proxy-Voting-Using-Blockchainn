import { z } from 'zod';
import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const createMeetingSchema = z.object({
  companyId: z.string().uuid('Invalid Company ID'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  meetingType: z.enum(['AGM', 'EGM', 'SPECIAL']).default('AGM'),
  scheduledDate: z.string().datetime({ offset: true }).or(z.string()),
  startTime: z.string().datetime({ offset: true }).or(z.string()),
  endTime: z.string().datetime({ offset: true }).or(z.string()),
  locationUrl: z.string().optional(),
});

export const updateMeetingStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
});

export const listMeetings = async (req, res, next) => {
  try {
    const { status, companyId } = req.query;

    const meetings = await prisma.meeting.findMany({
      where: {
        ...(status && { status }),
        ...(companyId && { companyId }),
      },
      include: {
        company: { select: { id: true, name: true, regNumber: true } },
        proposals: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            totalYesVotes: true,
            totalNoVotes: true,
            totalAbstainVotes: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    const formatted = meetings.map((m) => ({
      ...m,
      proposals: m.proposals.map((p) => ({
        ...p,
        totalYesVotes: p.totalYesVotes.toString(),
        totalNoVotes: p.totalNoVotes.toString(),
        totalAbstainVotes: p.totalAbstainVotes.toString(),
      })),
    }));

    return res.status(200).json({ success: true, data: { meetings: formatted } });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        company: true,
        proposals: {
          include: {
            aiSummary: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const formattedProposals = meeting.proposals.map((p) => ({
      ...p,
      totalYesVotes: p.totalYesVotes.toString(),
      totalNoVotes: p.totalNoVotes.toString(),
      totalAbstainVotes: p.totalAbstainVotes.toString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        meeting: {
          ...meeting,
          proposals: formattedProposals,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const { companyId, title, description, meetingType, scheduledDate, startTime, endTime, locationUrl } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        companyId,
        title: title.trim(),
        description: description.trim(),
        meetingType: meetingType || 'AGM',
        scheduledDate: new Date(scheduledDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        locationUrl: locationUrl ? locationUrl.trim() : null,
        status: 'SCHEDULED',
      },
      include: { company: true },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEETING_CREATED',
      entity: 'MEETING',
      entityId: meeting.id,
      status: 'SUCCESS',
      details: { title: meeting.title, meetingType: meeting.meetingType },
    });

    return res.status(201).json({
      success: true,
      message: 'Governance meeting scheduled successfully',
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeetingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: { status },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MEETING_STATUS_UPDATED',
      entity: 'MEETING',
      entityId: id,
      status: 'SUCCESS',
      details: { newStatus: status },
    });

    return res.status(200).json({
      success: true,
      message: `Meeting status updated to ${status}`,
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};
