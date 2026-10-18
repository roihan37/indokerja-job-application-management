import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Masukkan email Anda.')
    .max(254, 'Email terlalu panjang.')
    .email('Masukkan alamat email yang valid.'),
  password: z
    .string()
    .min(1, 'Masukkan kata sandi Anda.')
    .max(256, 'Kata sandi terlalu panjang.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
