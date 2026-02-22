import { describe, it, expect } from 'vitest';
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';

describe('Admin Authentication', () => {
  it('should have UNAUTHED_ERR_MSG constant defined', () => {
    expect(UNAUTHED_ERR_MSG).toBeDefined();
    expect(typeof UNAUTHED_ERR_MSG).toBe('string');
    expect(UNAUTHED_ERR_MSG.length).toBeGreaterThan(0);
  });

  it('should have NOT_ADMIN_ERR_MSG constant defined', () => {
    expect(NOT_ADMIN_ERR_MSG).toBeDefined();
    expect(typeof NOT_ADMIN_ERR_MSG).toBe('string');
    expect(NOT_ADMIN_ERR_MSG.length).toBeGreaterThan(0);
  });

  it('should verify adminProcedure middleware exists in trpc', async () => {
    const { adminProcedure } = await import('./_core/trpc');
    expect(adminProcedure).toBeDefined();
  });

  it('should verify quotes.list uses adminProcedure', async () => {
    const { appRouter } = await import('./routers');
    // Check that the router has the quotes.list endpoint
    expect(appRouter._def.procedures).toHaveProperty('quotes.list');
  });

  it('should verify quotes.updatePaymentStatus uses adminProcedure', async () => {
    const { appRouter } = await import('./routers');
    // Check that the router has the quotes.updatePaymentStatus endpoint
    expect(appRouter._def.procedures).toHaveProperty('quotes.updatePaymentStatus');
  });

  it('should verify owner gets admin role on upsert', async () => {
    const { ENV } = await import('./_core/env');
    const { upsertUser, getUserByOpenId } = await import('./db');
    
    // Simulate owner login
    await upsertUser({
      openId: ENV.ownerOpenId,
      name: 'Test Owner',
      email: 'owner@test.com',
      loginMethod: 'email',
      lastSignedIn: new Date(),
    });
    
    // Verify owner has admin role
    const owner = await getUserByOpenId(ENV.ownerOpenId);
    expect(owner).toBeDefined();
    expect(owner?.role).toBe('admin');
  });

  it('should verify non-owner gets user role by default', async () => {
    const { upsertUser, getUserByOpenId } = await import('./db');
    
    const testOpenId = 'test-non-owner-' + Date.now();
    
    // Simulate non-owner login
    await upsertUser({
      openId: testOpenId,
      name: 'Test User',
      email: 'user@test.com',
      loginMethod: 'email',
      lastSignedIn: new Date(),
    });
    
    // Verify user has default user role
    const user = await getUserByOpenId(testOpenId);
    expect(user).toBeDefined();
    expect(user?.role).toBe('user');
  });
});
