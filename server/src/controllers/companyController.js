import { z } from 'zod';
import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  regNumber: z.string().min(3, 'Registration number is required'),
  industry: z.string().min(2, 'Industry is required'),
  contactEmail: z.string().email('Invalid email address'),
  description: z.string().optional(),
});

export const listCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { shareholders: true, meetings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { companies },
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        meetings: { orderBy: { scheduledDate: 'desc' } },
        _count: { select: { shareholders: true } },
      },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.status(200).json({ success: true, data: { company } });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const { name, regNumber, industry, contactEmail, description } = req.body;

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        regNumber: regNumber.trim(),
        industry: industry.trim(),
        contactEmail: contactEmail.trim(),
        description: description ? description.trim() : null,
      },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'COMPANY_CREATED',
      entity: 'COMPANY',
      entityId: company.id,
      status: 'SUCCESS',
      details: { name: company.name, regNumber: company.regNumber },
    });

    return res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};
