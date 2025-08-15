import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ResetPasswordFormSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .regex(emailRegex, 'Invalid email format'),
});

export default ResetPasswordFormSchema;