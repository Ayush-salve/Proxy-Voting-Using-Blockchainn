import prisma from '../config/db.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      totalShareholders,
      shareholders,
      proposals,
      votes,
      activeDelegations,
      anomaliesCount,
      auditLogsCount,
    ] = await Promise.all([
      prisma.shareholder.count({ where: { status: 'ACTIVE' } }),
      prisma.shareholder.findMany({ select: { totalShares: true, votingPower: true } }),
      prisma.proposal.findMany({
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          totalYesVotes: true,
          totalNoVotes: true,
          totalAbstainVotes: true,
        },
      }),
      prisma.vote.findMany({
        select: {
          id: true,
          choice: true,
          votingPowerUsed: true,
          proxyDelegationId: true,
          createdAt: true,
        },
      }),
      prisma.proxyDelegation.count({
        where: { status: 'ACTIVE', validUntil: { gt: new Date() } },
      }),
      prisma.anomalyAlert.count({ where: { isResolved: false } }),
      prisma.auditLog.count(),
    ]);

    // Calculate Total Issued Shares & Voting Power
    const totalIssuedShares = shareholders.reduce((acc, s) => acc + Number(s.totalShares), 0);
    const totalVotingPowerIssued = shareholders.reduce((acc, s) => acc + Number(s.votingPower), 0);

    // Calculate Total Votes Power Cast
    const totalVotesPowerCast = votes.reduce((acc, v) => acc + Number(v.votingPowerUsed), 0);
    const directVotesCount = votes.filter((v) => !v.proxyDelegationId).length;
    const proxyVotesCount = votes.filter((v) => !!v.proxyDelegationId).length;

    // Overall Turnout Percentage
    const turnoutPercentage = totalVotingPowerIssued > 0
      ? Math.round((totalVotesPowerCast / totalVotingPowerIssued) * 100 * 10) / 10
      : 0;

    // Proposal-Specific Vote Distribution Chart Data
    const proposalCharts = proposals.map((p) => {
      const yes = Number(p.totalYesVotes);
      const no = Number(p.totalNoVotes);
      const abstain = Number(p.totalAbstainVotes);
      const total = yes + no + abstain;
      return {
        id: p.id,
        title: p.title.length > 25 ? `${p.title.substring(0, 25)}...` : p.title,
        fullTitle: p.title,
        category: p.category,
        status: p.status,
        yes,
        no,
        abstain,
        totalVotes: total,
        yesPercentage: total > 0 ? Math.round((yes / total) * 100) : 0,
      };
    });

    // Voting Channel Breakdown (Direct vs Proxy)
    const votingChannelSplit = [
      { name: 'Direct Shareholder Votes', value: directVotesCount, color: '#22c55e' },
      { name: 'Proxy Delegated Votes', value: proxyVotesCount, color: '#9d4edd' },
    ];

    // Global Choice Distribution
    const globalChoiceSplit = [
      { name: 'YES', value: votes.filter((v) => v.choice === 'YES').length, color: '#10b981' },
      { name: 'NO', value: votes.filter((v) => v.choice === 'NO').length, color: '#ef4444' },
      { name: 'ABSTAIN', value: votes.filter((v) => v.choice === 'ABSTAIN').length, color: '#f59e0b' },
    ];

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalShareholders,
          totalIssuedShares,
          totalVotingPowerIssued,
          totalVotesRecorded: votes.length,
          totalVotesPowerCast,
          activeDelegations,
          turnoutPercentage: `${turnoutPercentage}%`,
          unresolvedAnomalies: anomaliesCount,
          totalAuditEvents: auditLogsCount,
        },
        proposalCharts,
        votingChannelSplit,
        globalChoiceSplit,
      },
    });
  } catch (error) {
    next(error);
  }
};
