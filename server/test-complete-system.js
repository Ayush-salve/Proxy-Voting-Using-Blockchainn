const BASE_URL = 'http://localhost:5000/api';

async function runMasterTest() {
  console.log('🚀 Starting Master System Test for BlockProxy Platform (v1.1 with Approvals & Proxy Creation)...\n');
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
    // 1. Health
    console.log('1. System Health:');
    const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(health.status === 'ONLINE', 'Platform backend status is ONLINE');

    // 2. Auth: Login all 4 roles with role enforcement
    console.log('\n2. Role-Based Authentication & Tokens:');
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@blockproxy.com', password: 'Admin@12345', role: 'COMPANY_ADMIN' }),
    }).then((r) => r.json());
    const adminToken = adminLogin.data.accessToken;
    assert(adminLogin.data.user.role === 'COMPANY_ADMIN', 'Admin authentication verified with role check');

    const shLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ayush@blockproxy.com', password: 'Shareholder@12345', role: 'SHAREHOLDER' }),
    }).then((r) => r.json());
    const shToken = shLogin.data.accessToken;
    assert(shLogin.data.user.role === 'SHAREHOLDER', 'Shareholder authentication verified');

    // Role mismatch prevention test
    const mismatchLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ayush@blockproxy.com', password: 'Shareholder@12345', role: 'AUDITOR' }),
    }).then((r) => r.json());
    assert(mismatchLogin.success === false, 'Role mismatch prevention working as expected');

    // 3. User Registration & Admin Approval Workflow
    console.log('\n3. Registration & Admin Approval Network Gatekeeper:');
    const testRegEmail = `testuser_${Date.now()}@corporate.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Kavita Krishnamurthy',
        email: testRegEmail,
        password: 'Password@123',
        role: 'SHAREHOLDER',
      }),
    }).then((r) => r.json());
    assert(regRes.requiresApproval === true, 'New shareholder registration placed in PENDING approval queue');

    // Attempt login before approval (should be blocked)
    const preApprovalLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testRegEmail, password: 'Password@123', role: 'SHAREHOLDER' }),
    }).then((r) => r.json());
    assert(preApprovalLogin.code === 'REGISTRATION_PENDING_APPROVAL', 'Unapproved user blocked from network access');

    // Admin lists pending requests
    const pendingRequests = await fetch(`${BASE_URL}/admin/registration-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    const targetReq = pendingRequests.data.requests.find((r) => r.email === testRegEmail);
    assert(!!targetReq, 'Admin receives registration notification/request in approval queue');

    // Admin approves request and assigns Folio + 3,000 shares
    const approveRes = await fetch(`${BASE_URL}/admin/registration-requests/${targetReq.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        totalShares: 3000,
        votingPower: 3000,
      }),
    }).then((r) => r.json());
    assert(approveRes.success === true, 'Admin successfully approves registration and allocates Folio');

    // Now user logs in successfully
    const postApprovalLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testRegEmail, password: 'Password@123', role: 'SHAREHOLDER' }),
    }).then((r) => r.json());
    assert(postApprovalLogin.success === true, 'Approved user now successfully logs in to platform');

    // 4. Admin Direct Proxy Creation
    console.log('\n4. Admin Direct Proxy Creation:');
    const testProxyEmail = `proxy_${Date.now()}@advisory.com`;
    const createProxyRes = await fetch(`${BASE_URL}/admin/proxies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Aditya Birla Proxy Services',
        email: testProxyEmail,
        password: 'ProxyPassword@123',
      }),
    }).then((r) => r.json());
    assert(createProxyRes.success === true, 'Admin successfully created Proxy Representative');

    // 5. Admin Direct Shareholder Creation with Assigned Password
    console.log('\n5. Admin Direct Shareholder Creation (with Assigned Password):');
    const testShEmail = `shareholder_${Date.now()}@enterprise.com`;
    const createShRes = await fetch(`${BASE_URL}/shareholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Sunita Rao',
        userEmail: testShEmail,
        password: 'SunitaPassword@123',
        folioNumber: `FOLIO-APX-${Math.floor(10000 + Math.random() * 90000)}`,
        totalShares: 5000,
        votingPower: 5000,
      }),
    }).then((r) => r.json());
    assert(createShRes.success === true, 'Admin created shareholder folio and assigned custom password');

    // 6. Corporate Admin Auto-Assignment Registration
    console.log('\n6. Corporate Admin Auto-Assignment Registration:');
    const adminAutoEmail = `admin_board_${Date.now()}@blockproxy.com`;
    const adminAutoReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Board Secretarial Assistant',
        email: adminAutoEmail,
        password: 'AdminPassword@123',
      }),
    }).then((r) => r.json());
    assert(adminAutoReg.requiresApproval === false && adminAutoReg.data.user.role === 'COMPANY_ADMIN', 'Corporate admin email automatically assigned Admin role with instant access');

    // 7. Blockchain Explorer & Cryptographic Verification
    console.log('\n7. Blockchain Ledger & Verification:');
    const bcTxRes = await fetch(`${BASE_URL}/blockchain/transactions`).then((r) => r.json());
    assert(bcTxRes.data.transactions.length >= 1, 'Blockchain transaction ledger retrieves on-chain ballots');

    const sampleHash = bcTxRes.data.transactions[0].txHash;
    const verifyRes = await fetch(`${BASE_URL}/blockchain/verify/${sampleHash}`).then((r) => r.json());
    assert(verifyRes.isVerified === true, 'Cryptographic dual-state verification succeeded (DB vs EVM proof)');

    // 8. Analytics & Audit Trail
    console.log('\n8. Governance Analytics & Audit Trail:');
    const analyticsRes = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(analyticsRes.data.kpis.totalShareholders >= 3, 'Analytics KPIs computed with newly approved folios');

    // Final Summary
    console.log(`\n====================================================`);
    console.log(`🎉 Master System Test Complete: ${passed}/${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`====================================================\n`);
  } catch (err) {
    console.error('Master Test Execution Error:', err);
  }
}

runMasterTest();
