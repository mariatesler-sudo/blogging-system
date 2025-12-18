// frontend/__tests__/getUserIdFromToken.test.js
/**
 * @jest-environment jsdom
 */

const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getUserIdFromToken = () => {
  const storedToken = localStorage.getItem('token');
  if (!storedToken) return null;

  const payload = decodeJwtPayload(storedToken);
  return payload?.sub ?? payload?.user_id ?? payload?.id ?? null;
};

describe('getUserIdFromToken function', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns null when no token', () => {
    expect(getUserIdFromToken()).toBeNull();
  });

  test('extracts user id from token with sub field', () => {
    const payload = { sub: 'user123' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('token', token);

    expect(getUserIdFromToken()).toBe('user123');
  });

  test('extracts user id from token with user_id field', () => {
    const payload = { user_id: 456 };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('token', token);

    expect(getUserIdFromToken()).toBe(456);
  });

  test('extracts user id from token with id field', () => {
    const payload = { id: '789' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('token', token);

    expect(getUserIdFromToken()).toBe('789');
  });

  test('returns null for invalid token', () => {
    localStorage.setItem('token', 'invalid.token');
    expect(getUserIdFromToken()).toBeNull();
  });
});