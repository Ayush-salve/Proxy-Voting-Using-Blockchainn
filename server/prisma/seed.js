import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Full BlockProxy Database Seeding...');

  // 1. Company
  const company = await prisma.company.upsert({
    where: { regNumber: 'AGTC-2026-US-8910' },
    update: {},
    create: {
      name: 'Apex Global Technologies Corp',
      regNumber: 'AGTC-2026-US-8910',
      industry: 'Enterprise Fintech & Blockchain Infrastructure',
      contactEmail: 'governance@apexglobal.io',
      description:
        'A leading publicly traded multinational enterprise specializing in decentralized enterprise infrastructure and secure corporate governance.',
    },
  });

  const salt = await bcrypt.genSalt(12);

  // 2. Admin User
  const adminPassword = await bcrypt.hash('Admin@12345', salt);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@blockproxy.com' },
    update: {},
    create: {
      email: 'admin@blockproxy.com',
      passwordHash: adminPassword,
      fullName: 'Vikram Malhotra (Company Secretary)',
      role: 'COMPANY_ADMIN',
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      isActive: true,
    },
  });

  // 3. Auditor User
  const auditorPassword = await bcrypt.hash('Auditor@12345', salt);
  const auditorUser = await prisma.user.upsert({
    where: { email: 'auditor@blockproxy.com' },
    update: {},
    create: {
      email: 'auditor@blockproxy.com',
      passwordHash: auditorPassword,
      fullName: 'PwC Corporate Governance Assurance',
      role: 'AUDITOR',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isActive: true,
    },
  });

  // 4. Proxy Representative User
  const proxyPassword = await bcrypt.hash('Proxy@12345', salt);
  const proxyUser = await prisma.user.upsert({
    where: { email: 'rahul@blockproxy.com' },
    update: {},
    create: {
      email: 'rahul@blockproxy.com',
      passwordHash: proxyPassword,
      fullName: 'Rahul Verma (Proxy Advisory Counsel)',
      role: 'PROXY_REPRESENTATIVE',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isActive: true,
    },
  });

  // 5. Shareholder 1: Ayush Sharma (2,500 Shares)
  const shareholder1Password = await bcrypt.hash('Shareholder@12345', salt);
  const shareholder1User = await prisma.user.upsert({
    where: { email: 'ayush@blockproxy.com' },
    update: {},
    create: {
      email: 'ayush@blockproxy.com',
      passwordHash: shareholder1Password,
      fullName: 'Ayush Sharma',
      role: 'SHAREHOLDER',
      walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      isActive: true,
    },
  });

  const shareholder1 = await prisma.shareholder.upsert({
    where: { userId: shareholder1User.id },
    update: {},
    create: {
      userId: shareholder1User.id,
      companyId: company.id,
      folioNumber: 'FOLIO-APX-001',
      totalShares: BigInt(2500),
      votingPower: BigInt(2500),
      delegatedPowerOut: BigInt(0),
      status: 'ACTIVE',
    },
  });

  // 6. Shareholder 2: Sarah Jenkins (5,000 Shares, 1,000 Delegated to Rahul)
  const shareholder2Password = await bcrypt.hash('Shareholder@12345', salt);
  const shareholder2User = await prisma.user.upsert({
    where: { email: 'sarah@blockproxy.com' },
    update: {},
    create: {
      email: 'sarah@blockproxy.com',
      passwordHash: shareholder2Password,
      fullName: 'Sarah Jenkins',
      role: 'SHAREHOLDER',
      walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      isActive: true,
    },
  });

  const shareholder2 = await prisma.shareholder.upsert({
    where: { userId: shareholder2User.id },
    update: {},
    create: {
      userId: shareholder2User.id,
      companyId: company.id,
      folioNumber: 'FOLIO-APX-002',
      totalShares: BigInt(5000),
      votingPower: BigInt(5000),
      delegatedPowerOut: BigInt(1000),
      status: 'ACTIVE',
    },
  });

  // 7. Governance Meetings
  const now = new Date();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const pastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let agmMeeting = await prisma.meeting.findFirst({ where: { title: 'Annual General Meeting 2026' } });
  if (!agmMeeting) {
    agmMeeting = await prisma.meeting.create({
      data: {
        companyId: company.id,
        title: 'Annual General Meeting 2026',
        description: 'Comprehensive annual meeting of shareholders to vote on board resolutions, capital allocation, and statutory appointments.',
        meetingType: 'AGM',
        scheduledDate: nextMonth,
        startTime: pastWeek,
        endTime: nextMonth,
        locationUrl: 'https://governance.apexglobal.io/live/agm-2026',
        status: 'ACTIVE',
      },
    });
  }

  // 8. Proposals
  let prop1 = await prisma.proposal.findFirst({ where: { title: 'Resolution 1: Election of Independent Director (Ms. Elena Rostova)' } });
  if (!prop1) {
    prop1 = await prisma.proposal.create({
      data: {
        meetingId: agmMeeting.id,
        title: 'Resolution 1: Election of Independent Director (Ms. Elena Rostova)',
        description: 'Proposal to elect Ms. Elena Rostova as an Independent Non-Executive Director for a three-year term effective immediately.',
        category: 'Board Election',
        startTime: pastWeek,
        endTime: nextMonth,
        status: 'VOTING_OPEN',
        totalYesVotes: BigInt(1500),
        totalNoVotes: BigInt(200),
        totalAbstainVotes: BigInt(100),
      },
    });

    await prisma.aISummary.create({
      data: {
        proposalId: prop1.id,
        executiveSummary: 'This resolution recommends appointing Ms. Elena Rostova as an Independent Director for a 3-year term to oversee corporate risk and sustainability committees.',
        keyPoints: JSON.stringify([
          'Candidate: Ms. Elena Rostova (Former Global Fintech Risk Head)',
          'Term: 3 Years (2026-2029)',
          'Committee Role: Chair of Audit and Risk Committee',
          'Voting Options: YES / NO / ABSTAIN',
          'Neutrality Note: AI does not advise; voting choice is strictly at shareholder discretion',
        ]),
        importantDates: JSON.stringify({
          votingOpens: pastWeek.toISOString(),
          votingCloses: nextMonth.toISOString(),
        }),
        financialImpact: 'Standard non-executive director compensation policy applies.',
        legalComplexity: 'Complies with SEC independent director statutory regulations.',
        neutralityScore: 1.0,
      },
    });
  }

  let prop2 = await prisma.proposal.findFirst({ where: { title: 'Resolution 2: Approval of Decarbonization & Clean Tech Capital Expenditure ($50M)' } });
  if (!prop2) {
    prop2 = await prisma.proposal.create({
      data: {
        meetingId: agmMeeting.id,
        title: 'Resolution 2: Approval of Decarbonization & Clean Tech Capital Expenditure ($50M)',
        description: 'Authorization for capital expenditure of up to $50,000,000 to transition enterprise cloud data centers to 100% renewable power sources.',
        category: 'Capital Allocation',
        startTime: pastWeek,
        endTime: nextMonth,
        status: 'VOTING_OPEN',
        totalYesVotes: BigInt(3200),
        totalNoVotes: BigInt(450),
        totalAbstainVotes: BigInt(50),
      },
    });

    await prisma.aISummary.create({
      data: {
        proposalId: prop2.id,
        executiveSummary: 'Authorizes a $50M capital expenditure over 24 months to transition enterprise data centers to net-zero solar and wind micro-grids.',
        keyPoints: JSON.stringify([
          'Budget Cap: $50,000,000',
          'Timeline: 24 Months execution',
          'Expected Energy Cost Reduction: 28% annualized by 2028',
          'Impact: Sustainability compliance and long-term operating cost reduction',
        ]),
        importantDates: JSON.stringify({
          votingOpens: pastWeek.toISOString(),
          votingCloses: nextMonth.toISOString(),
        }),
        financialImpact: '$50M funded from retained operational earnings with zero debt dilution.',
        legalComplexity: 'Standard shareholder special resolution threshold applies.',
        neutralityScore: 1.0,
      },
    });
  }

  let prop3 = await prisma.proposal.findFirst({ where: { title: 'Resolution 3: Executive Compensation Policy & Incentive Alignment 2026-2029' } });
  if (!prop3) {
    prop3 = await prisma.proposal.create({
      data: {
        meetingId: agmMeeting.id,
        title: 'Resolution 3: Executive Compensation Policy & Incentive Alignment 2026-2029',
        description: 'Advisory resolution on executive remuneration policy, linking 60% of executive long-term incentives to sustainable shareholder returns.',
        category: 'Executive Remuneration',
        startTime: pastWeek,
        endTime: nextMonth,
        status: 'PUBLISHED',
        totalYesVotes: BigInt(0),
        totalNoVotes: BigInt(0),
        totalAbstainVotes: BigInt(0),
      },
    });

    await prisma.aISummary.create({
      data: {
        proposalId: prop3.id,
        executiveSummary: 'Presents the 3-year executive compensation framework with enhanced clawback clauses and performance-vested stock units.',
        keyPoints: JSON.stringify([
          'Scope: C-Suite and Executive Committee',
          'Performance Hurdle: 12% Annualized Return on Equity (ROE)',
          'Clawback Provisions: Enforceable in cases of restatements or governance misconduct',
        ]),
        importantDates: JSON.stringify({
          votingOpens: pastWeek.toISOString(),
          votingCloses: nextMonth.toISOString(),
        }),
        financialImpact: 'Performance-linked equity grants capped at 1.5% total share pool.',
        legalComplexity: 'Standard governance remuneration advisory vote.',
        neutralityScore: 1.0,
      },
    });
  }

  // 9. Sample Proxy Delegation: Sarah -> Rahul (1,000 votes)
  const existingDelegation = await prisma.proxyDelegation.findFirst({
    where: { delegatorUserId: shareholder2User.id, proxyUserId: proxyUser.id },
  });

  if (!existingDelegation) {
    await prisma.proxyDelegation.create({
      data: {
        delegatorUserId: shareholder2User.id,
        proxyUserId: proxyUser.id,
        shareholderId: shareholder2.id,
        delegatedPower: BigInt(1000),
        validFrom: pastWeek,
        validUntil: nextMonth,
        status: 'ACTIVE',
        onChainTxHash: '0x83A91d4e6b28f910ac77b31c94e015d8f07293b6e821045c71982b61f930129a',
      },
    });
    console.log('📜 Active Proxy Delegation seeded: Sarah Jenkins -> Rahul Verma (1,000 Votes)');
  }

  // 10. Sample Anomaly Alert for Security Monitoring Center
  const existingAnomaly = await prisma.anomalyAlert.findFirst({
    where: { targetEntity: 'AUTH' },
  });

  if (!existingAnomaly) {
    await prisma.anomalyAlert.create({
      data: {
        userId: shareholder1User.id,
        targetEntity: 'AUTH',
        reason: 'Velocity Check: 3 rapid failed login attempts recorded from unrecognized IP subnet.',
        severity: 'MEDIUM',
        rawMetadata: JSON.stringify({ ip: '192.168.1.105', subnet: 'External', attempts: 3 }),
        isResolved: false,
      },
    });
  }

  console.log('✅ Full Governance Database Seeding Finished Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
