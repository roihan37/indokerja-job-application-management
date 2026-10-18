import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().trim().max(120, 'Nama maksimal 120 karakter.'),
  phone: z.string().trim().max(40, 'Nomor telepon maksimal 40 karakter.'),
  location: z.string().trim().max(200, 'Lokasi maksimal 200 karakter.'),
  headline: z.string().trim().max(200, 'Headline maksimal 200 karakter.'),
  summary: z.string().trim().max(3000, 'Ringkasan maksimal 3.000 karakter.'),
});
export type ProfileFormInput = z.infer<typeof profileSchema>;

export function validateResume(file: File): string | undefined {
  if (file.type !== 'application/pdf') {
    return 'Pilih file PDF.';
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    return 'Ukuran PDF harus antara 1 byte dan 5 MB.';
  }
}
