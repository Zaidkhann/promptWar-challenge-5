import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

describe('Authentication & Security Unit Tests', () => {
  it('should securely hash password with bcrypt and verify correctly', async () => {
    const rawPassword = 'SuperSecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true); // standard bcrypt prefix

    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and verify valid JWT token payload', () => {
    const payload = {
      id: 'usr_test_123',
      email: 'organizer@test.com',
      name: 'Test Organizer',
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });

  it('should reject tampered or invalid JWT tokens', () => {
    const validToken = jwt.sign({ id: 'usr_1' }, env.JWT_SECRET, { expiresIn: '1h' });
    const tamperedToken = validToken + 'tamper';

    expect(() => {
      jwt.verify(tamperedToken, env.JWT_SECRET);
    }).toThrow();
  });
});
