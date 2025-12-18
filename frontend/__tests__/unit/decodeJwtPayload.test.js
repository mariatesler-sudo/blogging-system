// frontend/__tests__/decodeJwtPayload.test.js
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

describe('decodeJwtPayload function', () => {
  test('decodes valid JWT token', () => {
    const payload = {
      sub: 'user123',
      username: 'testuser',
      exp: 1234567890
    };

    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    const result = decodeJwtPayload(token);

    expect(result).toEqual(payload);
  });

  test('returns null for invalid tokens', () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload('')).toBeNull();
    expect(decodeJwtPayload('invalid')).toBeNull();
    expect(decodeJwtPayload('header.payload')).toBeNull(); // missing signature
  });

  test('handles malformed base64', () => {
    expect(decodeJwtPayload('header.invalid-base64.signature')).toBeNull();
  });
});