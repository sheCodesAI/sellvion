import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { resetDbForTests } from '../server/db/database.ts';
import { ensureDemoSeeded } from '../server/db/seedDemo.ts';
import {
  evaluatePolicyGuard,
  isTimeInQuietHours,
  runOrchestratorWorkflow,
  scoreCodOrderRisk,
  executeApprovedAction,
} from '../server/services/agents.ts';
import { createApp } from '../server.ts';

let tempDir = '';
let server: http.Server;
let baseUrl = '';

async function apiJson(
  endpoint: string,
  options: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const resp = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await resp.json()) as Record<string, any>;
  return { status: resp.status, data };
}

describe('SELLVION Platform End-to-End Verification', () => {
  before(async () => {
    process.env.SELLVION_SKIP_LISTEN = '1';
    delete process.env.GEMINI_API_KEY;
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sellvion-test-'));
    const dbPath = path.join(tempDir, 'test.db');
    const db = resetDbForTests(dbPath);
    ensureDemoSeeded(db);

    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('scores COD order risk with transparent explainable reasons', () => {
    const highRisk = scoreCodOrderRisk({
      isFirstTimeBuyer: true,
      pincode: '141001',
      address: 'Near Chowk',
      amount: 3200,
    });
    assert.ok(highRisk.score >= 60);
    assert.equal(highRisk.band, 'high');
    assert.ok(highRisk.reasons.length >= 3);

    const lowRisk = scoreCodOrderRisk({
      isFirstTimeBuyer: false,
      pincode: '411001',
      address: 'Flat 804, Koregaon Park Annexe, Pune',
      amount: 950,
    });
    assert.ok(lowRisk.score < 35);
    assert.equal(lowRisk.band, 'low');
  });

  it('evaluates quiet hours accurately across midnight IST boundary', () => {
    assert.equal(isTimeInQuietHours('21:00', '09:00', 22), true);
    assert.equal(isTimeInQuietHours('21:00', '09:00', 7), true);
    assert.equal(isTimeInQuietHours('21:00', '09:00', 14), false);
  });

  it('isolates Live Store tenants from Demo Store and each other', async () => {
    // 1. Demo mode has seeded customers
    const demoRes = await apiJson('/api/customers', { headers: { 'x-sellvion-mode': 'demo' } });
    assert.equal(demoRes.status, 200);
    assert.ok(demoRes.data.customers.length >= 6);

    // 2. Sign up Live Store A
    const signupA = await apiJson('/api/auth/signup', {
      method: 'POST',
      body: {
        email: 'storea@example.in',
        password: 'Password123!',
        fullName: 'Aarav Store A',
        businessName: 'Store A Kirana',
        city: 'Pune',
      },
    });
    assert.equal(signupA.status, 201);
    const tokenA = signupA.data.token as string;
    assert.ok(tokenA);

    // Live Store A starts clean (zero demo data leaked!)
    const custARes = await apiJson('/api/customers', { token: tokenA });
    assert.equal(custARes.status, 200);
    assert.equal(custARes.data.customers.length, 0);

    // Add a customer in Store A
    const createCustA = await apiJson('/api/customers', {
      method: 'POST',
      token: tokenA,
      body: {
        name: 'Kiran StoreA Buyer',
        phone: '+91 90000 11111',
        city: 'Pune',
        lastProductOrdered: 'Jaggery Powder 1kg',
        outstandingUdhaar: 750,
      },
    });
    assert.equal(createCustA.status, 201);
    const custAId = createCustA.data.customer.id as string;

    // 3. Sign up Live Store B and verify tenant isolation
    const signupB = await apiJson('/api/auth/signup', {
      method: 'POST',
      body: {
        email: 'storeb@example.in',
        password: 'Password123!',
        fullName: 'Meera Store B',
        businessName: 'Store B Naturals',
      },
    });
    assert.equal(signupB.status, 201);
    const tokenB = signupB.data.token as string;

    const custBList = await apiJson('/api/customers', { token: tokenB });
    assert.equal(custBList.data.customers.length, 0);

    const crossTenantFetch = await apiJson(`/api/customers/${custAId}`, { token: tokenB });
    assert.equal(crossTenantFetch.status, 404);
  });

  it('enforces Policy Guard opt-outs and prevents silent fake sends in Live Mode', async () => {
    const loginA = await apiJson('/api/auth/login', {
      method: 'POST',
      body: { email: 'storea@example.in', password: 'Password123!' },
    });
    assert.equal(loginA.status, 200);
    const tokenA = loginA.data.token as string;

    // Run workflow in Live Store A -> creates persistent approval
    const wfRes = await apiJson('/api/workflows/run', {
      method: 'POST',
      token: tokenA,
      body: { workflowType: 'udhaar_collection' },
    });
    assert.equal(wfRes.status, 201);
    assert.equal(wfRes.data.status, 'awaiting_approval');
    assert.ok(wfRes.data.approvalId);
    assert.equal(wfRes.data.tasks.length, 4);

    // Approving in Live Mode without WhatsApp connected MUST fail honestly (never silently pretend it sent)
    const approveFail = await apiJson(`/api/approvals/${wfRes.data.approvalId}/decision`, {
      method: 'POST',
      token: tokenA,
      body: { decision: 'approve' },
    });
    assert.equal(approveFail.status, 422);
    assert.equal(approveFail.data.ok, false);
    assert.match(approveFail.data.message, /WhatsApp Cloud API is not connected/i);

    // Verify Policy Guard blocks opted-out customers
    const db = resetDbForTests(process.env.SELLVION_DB_PATH!);
    const cust = db
      .prepare(`SELECT id, business_id FROM customers WHERE name = 'Kiran StoreA Buyer'`)
      .get() as { id: string; business_id: string };
    db.prepare('UPDATE customers SET opted_out = 1 WHERE id = ?').run(cust.id);

    const policy = evaluatePolicyGuard(db, {
      businessId: cust.business_id,
      customerId: cust.id,
      actionType: 'udhaar_reminder',
      confidence: 92,
      overrideQuietHours: true,
    });
    assert.equal(policy.allowed, false);
    assert.ok(policy.blockedReasons.some((r) => r.includes('opted out')));
  });

  it('supports CSV import, duplicate skipping, and batch rollback', async () => {
    const loginA = await apiJson('/api/auth/login', {
      method: 'POST',
      body: { email: 'storea@example.in', password: 'Password123!' },
    });
    const tokenA = loginA.data.token as string;

    const csvText = [
      'name,phone,city,last_product_ordered,outstanding_udhaar',
      'CSV Buyer One,+91 98111 22222,Surat,Spices,500',
      'CSV Buyer Duplicate,+91 90000 11111,Pune,Tea,0',
    ].join('\n');

    const impRes = await apiJson('/api/imports/execute', {
      method: 'POST',
      token: tokenA,
      body: { entityType: 'customers', filename: 'test.csv', csvText },
    });
    assert.equal(impRes.status, 201);
    assert.equal(impRes.data.importedRows, 1);
    assert.equal(impRes.data.skippedRows, 1);

    const rollbackRes = await apiJson(`/api/imports/${impRes.data.batchId}/rollback`, {
      method: 'POST',
      token: tokenA,
    });
    assert.equal(rollbackRes.status, 200);
    assert.equal(rollbackRes.data.removedRecords, 1);
  });

  it('simulates Demo Mode workflow and dispatch cleanly', async () => {
    const db = resetDbForTests(process.env.SELLVION_DB_PATH!);
    const wf = await runOrchestratorWorkflow(db, {
      businessId: 'demo-biz-01',
      userId: null,
      workflowType: 'reactivation',
      targetCustomerId: 'CUST-101',
      mode: 'demo',
    });
    assert.equal(wf.status, 'awaiting_approval');
    assert.ok(wf.approvalId);

    const exec = await executeApprovedAction(db, {
      businessId: 'demo-biz-01',
      approvalId: wf.approvalId!,
      userId: null,
      mode: 'demo',
      overrideQuietHours: true,
    });
    assert.equal(exec.ok, true);
    assert.match(exec.message, /Demo Mode: Simulated WhatsApp dispatch/);
  });

  it('supports order creation, order detail priorStats, customer timeline, escalation, schedule, profile update, and analytics funnel', async () => {
    const loginA = await apiJson('/api/auth/login', {
      method: 'POST',
      body: { email: 'storea@example.in', password: 'Password123!' },
    });
    const tokenA = loginA.data.token as string;

    // Create a fresh consented customer with pending udhaar for Store A
    const createCust7 = await apiJson('/api/customers', {
      method: 'POST',
      token: tokenA,
      body: {
        name: 'Vikram StoreA Buyer',
        phone: '+91 98222 33333',
        city: 'Pune',
        lastProductOrdered: 'Pure Ghee 1L',
        outstandingUdhaar: 600,
      },
    });
    assert.equal(createCust7.status, 201);
    const custAId = createCust7.data.customer.id as string;

    // Create high-risk COD order for Store A
    const orderRes = await apiJson('/api/orders', {
      method: 'POST',
      token: tokenA,
      body: {
        customerId: custAId,
        items: ['Pure Ghee 1L'],
        totalAmount: 2900,
        paymentMode: 'COD',
        deliveryAddress: 'Near Temple',
        pincode: '141001',
      },
    });
    assert.equal(orderRes.status, 201);
    const orderId = orderRes.data.order.id as string;
    assert.ok(orderRes.data.risk.score >= 50);

    // Order Detail returns priorStats
    const orderDetail = await apiJson(`/api/orders/${orderId}`, { token: tokenA });
    assert.equal(orderDetail.status, 200);
    assert.ok('prior_orders' in orderDetail.data.priorStats);

    // Customer Detail returns unified chronological timeline
    const custDetail = await apiJson(`/api/customers/${custAId}`, { token: tokenA });
    assert.equal(custDetail.status, 200);
    assert.ok(Array.isArray(custDetail.data.timeline));
    assert.ok(custDetail.data.timeline.length >= 1);

    // Udhaar endpoint returns enriched records
    const udhaarRes = await apiJson('/api/udhaar', { token: tokenA });
    assert.equal(udhaarRes.status, 200);
    assert.ok('latest_followup_status' in udhaarRes.data.records[0]);

    // Trigger COD workflow -> schedule approval -> escalate workflow
    const wfRes = await apiJson('/api/workflows/run', {
      method: 'POST',
      token: tokenA,
      body: { workflowType: 'cod_protection', targetOrderId: orderId },
    });
    assert.equal(wfRes.status, 201);

    const scheduleRes = await apiJson(`/api/approvals/${wfRes.data.approvalId}/decision`, {
      method: 'POST',
      token: tokenA,
      body: { decision: 'schedule', scheduledFor: '2026-11-20T10:00' },
    });
    assert.equal(scheduleRes.status, 200);
    assert.equal(scheduleRes.data.status, 'snoozed');
    assert.equal(scheduleRes.data.scheduledFor, '2026-11-20T10:00');

    const escRes = await apiJson(`/api/workflows/${wfRes.data.workflowId}/escalate`, {
      method: 'POST',
      token: tokenA,
      body: { reason: 'Call customer directly' },
    });
    assert.equal(escRes.status, 200);
    assert.equal(escRes.data.ok, true);

    // Update Business Profile
    const profRes = await apiJson('/api/business/profile', {
      method: 'PATCH',
      token: tokenA,
      body: { name: 'Store A Organic Mart', city: 'Pune' },
    });
    assert.equal(profRes.status, 200);
    assert.equal(profRes.data.business.name, 'Store A Organic Mart');

    // Analytics summary includes funnel & breakdowns derived from DB
    const anaRes = await apiJson('/api/analytics/summary?range=30d', { token: tokenA });
    assert.equal(anaRes.status, 200);
    assert.ok(anaRes.data.funnel.customersTracked >= 1);
    assert.ok(anaRes.data.paymentBreakdown.cod >= 1);
    assert.ok(anaRes.data.approvalBreakdown.scheduled >= 1);
    assert.ok('humanEscalations' in anaRes.data.actualObserved);
    assert.ok('messagesDelivered' in anaRes.data.actualObserved);
    assert.ok('avgResolutionMinutes' in anaRes.data.actualObserved);
  });

  it('enforces workflow/execution idempotency and closed-loop outcome verification across recovery, COD, and Udhaar', async () => {
    const db = resetDbForTests(process.env.SELLVION_DB_PATH!);

    // 1. Deduplication & double-execution idempotency in Demo Store
    const wf1 = await runOrchestratorWorkflow(db, {
      businessId: 'demo-biz-01',
      userId: null,
      workflowType: 'reactivation',
      targetCustomerId: 'CUST-102',
      mode: 'demo',
    });
    const wf2 = await runOrchestratorWorkflow(db, {
      businessId: 'demo-biz-01',
      userId: null,
      workflowType: 'reactivation',
      targetCustomerId: 'CUST-102',
      mode: 'demo',
    });
    assert.equal(wf2.deduplicated, true);
    assert.equal(wf2.approvalId, wf1.approvalId);

    const exec1 = await executeApprovedAction(db, {
      businessId: 'demo-biz-01',
      approvalId: wf1.approvalId!,
      userId: null,
      mode: 'demo',
      overrideQuietHours: true,
    });
    assert.equal(exec1.ok, true);
    const exec2 = await executeApprovedAction(db, {
      businessId: 'demo-biz-01',
      approvalId: wf1.approvalId!,
      userId: null,
      mode: 'demo',
      overrideQuietHours: true,
    });
    assert.equal(exec2.ok, true);
    assert.equal(exec2.alreadyExecuted, true);

    const approvalsAfterExec = await apiJson('/api/approvals', {
      headers: { 'x-sellvion-mode': 'demo' },
    });
    assert.equal(approvalsAfterExec.status, 200);
    const executedRow = (approvalsAfterExec.data.approvals as Array<Record<string, any>>).find(
      (a) => a.id === wf1.approvalId
    );
    assert.ok(executedRow);
    assert.equal(executedRow.execution_status, 'simulated');
    assert.ok(executedRow.provider_message_id);

    // 2. Closed-loop repeat purchase verification in Demo Store after executed reactivation
    const repeatOrderRes = await apiJson('/api/orders', {
      method: 'POST',
      headers: { 'x-sellvion-mode': 'demo' },
      body: {
        customerId: 'CUST-102',
        items: ['Cold-Pressed Coconut Oil 1L'],
        totalAmount: 1150,
        paymentMode: 'Prepaid_UPI',
      },
    });
    assert.equal(repeatOrderRes.status, 201);

    const anaAfterOrder = await apiJson('/api/analytics/summary?range=30d', {
      headers: { 'x-sellvion-mode': 'demo' },
    });
    assert.equal(anaAfterOrder.status, 200);
    assert.ok(anaAfterOrder.data.actualObserved.customersRecovered >= 1);
    assert.ok(anaAfterOrder.data.actualObserved.repeatPurchases >= 1);

    // 3. Closed-loop COD delivery outcome + workflow reconciliation
    const wfCod = await runOrchestratorWorkflow(db, {
      businessId: 'demo-biz-01',
      userId: null,
      workflowType: 'cod_protection',
      mode: 'demo',
    });
    assert.ok(wfCod.approvalId);
    const rejRes = await apiJson(`/api/approvals/${wfCod.approvalId}/decision`, {
      method: 'POST',
      headers: { 'x-sellvion-mode': 'demo' },
      body: { decision: 'reject', reason: 'Verified on phone' },
    });
    assert.equal(rejRes.status, 200);
    assert.equal(rejRes.data.status, 'rejected');

    // 4. Closed-loop Udhaar payment reconciles workflow
    const wfUdh = await runOrchestratorWorkflow(db, {
      businessId: 'demo-biz-01',
      userId: null,
      workflowType: 'udhaar_collection',
      targetCustomerId: 'CUST-103',
      mode: 'demo',
    });
    const payRes = await apiJson('/api/udhaar/CUST-103/payment', {
      method: 'POST',
      headers: { 'x-sellvion-mode': 'demo' },
      body: { amount: 500, method: 'UPI' },
    });
    assert.equal(payRes.status, 200);

    const wfRow = db
      .prepare('SELECT status, current_step FROM agent_workflows WHERE id = ?')
      .get(wfUdh.workflowId) as { status: string; current_step: string };
    assert.equal(wfRow.status, 'completed');
    assert.equal(wfRow.current_step, 'measure');
  });

  it('serves live system monitoring status and tenant-isolated JSON store backups', async () => {
    const sysDemo = await apiJson('/api/system/status', {
      headers: { 'x-sellvion-mode': 'demo' },
    });
    assert.equal(sysDemo.status, 200);
    assert.equal(sysDemo.data.ok, true);
    assert.equal(sysDemo.data.mode, 'demo');
    assert.ok(typeof sysDemo.data.uptimeSeconds === 'number');
    assert.ok(typeof sysDemo.data.connectedIntegrations === 'number');
    assert.ok(typeof sysDemo.data.workflows === 'object');

    const backupDemo = await apiJson('/api/business/backup', {
      headers: { 'x-sellvion-mode': 'demo' },
    });
    assert.equal(backupDemo.status, 200);
    assert.equal(backupDemo.data.mode, 'demo');
    assert.ok(Array.isArray(backupDemo.data.customers));
    assert.ok(backupDemo.data.customers.length >= 16);
    assert.ok(Array.isArray(backupDemo.data.orders));
    assert.ok(backupDemo.data.orders.length >= 16);
    assert.ok(Array.isArray(backupDemo.data.auditLogs));
    assert.ok(backupDemo.data.auditLogs.length >= 5);

    const anaDemo = await apiJson('/api/analytics/summary?range=30d', {
      headers: { 'x-sellvion-mode': 'demo' },
    });
    assert.equal(anaDemo.status, 200);
    assert.ok(anaDemo.data.orderStatusBreakdown.pendingVerification >= 1);
    assert.ok(anaDemo.data.orderStatusBreakdown.inTransit >= 1);
    assert.ok(anaDemo.data.orderStatusBreakdown.delivered >= 1);
    assert.ok(anaDemo.data.orderStatusBreakdown.rtoReturned >= 1);
    assert.ok(anaDemo.data.approvalBreakdown.needsApproval >= 1);
    assert.ok(anaDemo.data.approvalBreakdown.completed >= 1);
    assert.ok(anaDemo.data.approvalBreakdown.scheduled >= 1);
    assert.ok(anaDemo.data.approvalBreakdown.issues >= 1);
    assert.ok(Array.isArray(anaDemo.data.orderTrend) && anaDemo.data.orderTrend.length >= 5);
  });
});

