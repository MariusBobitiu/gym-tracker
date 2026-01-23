import { z } from 'zod';

export const emailSchema = z
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be a valid email address')
  .max(255, 'Email must be at most 255 characters')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
