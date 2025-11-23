/**
 * Test Authentication System
 * Provides a hardcoded test user to bypass email verification
 * This allows testing database functionality without Supabase auth
 */

export const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for testing
  email: 'test@laya.app',
  created_at: new Date().toISOString(),
};

export const TEST_SESSION = {
  access_token: 'test-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'test-refresh-token',
  user: TEST_USER,
};

/**
 * Use this to get the test user ID for database operations
 */
export function getTestUserId(): string {
  return TEST_USER.id;
}

