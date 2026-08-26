const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Automated End-to-End Tests for Phase 1...\n');
  let passed = 0;
  let total = 0;

  const assert = (condition, title) => {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
    }
  };

  try {
    // 1. Test Health Endpoint
    console.log('1. Health Check Test:');
    const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(healthRes.status === 'ONLINE', 'Backend health returns ONLINE');

    // 2. Test Admin Login
    console.log('\n2. Authentication & JWT Tests:');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blockproxy.com',
        password: 'Admin@12345',
      }),
    }).then((r) => r.json());

    const adminToken = adminLoginRes.data?.accessToken;
    const adminRefreshToken = adminLoginRes.data?.refreshToken;
    assert(!!adminToken && !!adminRefreshToken, 'Admin login issues access and refresh tokens');
    assert(adminLoginRes.data?.user?.role === 'COMPANY_ADMIN', 'Admin role claim is COMPANY_ADMIN');

    // 3. Test Shareholder Login & Portfolio
    const shLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ayush@blockproxy.com',
        password: 'Shareholder@12345',
      }),
    }).then((r) => r.json());

    const shToken = shLoginRes.data?.accessToken;
    assert(shLoginRes.data?.user?.role === 'SHAREHOLDER', 'Shareholder login verifies role');

    // 4. Test Protected /auth/me Endpoint
    console.log('\n3. Protected User Profile Test:');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${shToken}` },
    }).then((r) => r.json());
    assert(meRes.data?.user?.email === 'ayush@blockproxy.com', 'GET /auth/me returns authenticated shareholder profile');

    // 5. Test Shareholder Portfolio
    console.log('\n4. Shareholder Portfolio & Voting Power Accounting:');
    const portfolioRes = await fetch(`${BASE_URL}/shareholders/me/portfolio`, {
      headers: { Authorization: `Bearer ${shToken}` },
    }).then((r) => r.json());
    const portfolio = portfolioRes.data?.portfolio;
    assert(portfolio?.folioNumber === 'FOLIO-APX-001', 'Folio number is FOLIO-APX-001');
    assert(portfolio?.totalShares === '2500', 'Total Shares owned is 2,500');
    assert(portfolio?.availableVotingPower === '2500', 'Available Voting Power is 2,500');

    // 6. Test Admin List Shareholders
    console.log('\n5. Admin Shareholder Management Tests:');
    const listRes = await fetch(`${BASE_URL}/shareholders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(listRes.data?.shareholders?.length >= 2, 'Admin can list registered shareholders');

    // 7. Test Duplicate Folio Prevention
    const duplicateRes = await fetch(`${BASE_URL}/shareholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: shLoginRes.data.user.id,
        companyId: portfolio.company.id,
        folioNumber: 'FOLIO-APX-TEST-99',
        totalShares: 1500,
        votingPower: 1500,
      }),
    });
    assert(
      duplicateRes.status === 409,
      'Shareholder duplicate folio assignment prevented (HTTP 409 Conflict)'
    );

    // 8. Test Role-Based Access Control (RBAC) Enforcement
    console.log('\n6. Security & RBAC Enforcement Tests:');
    const rbacBlockedRes = await fetch(`${BASE_URL}/shareholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shToken}`, // Non-admin token
      },
      body: JSON.stringify({
        userId: shLoginRes.data.user.id,
        companyId: portfolio.company.id,
        folioNumber: 'FOLIO-HACK',
        totalShares: 1000,
      }),
    });
    assert(rbacBlockedRes.status === 403, 'Shareholder attempting Admin endpoint receives 403 Forbidden');

    // Summary
    console.log(`\n====================================================`);
    console.log(`🎯 Test Results: ${passed}/${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`====================================================\n`);
  } catch (err) {
    console.error('Test execution error:', err.message);
  }
}

runTests();
