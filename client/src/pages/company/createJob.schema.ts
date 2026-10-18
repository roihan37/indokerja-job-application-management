import { z } from 'zod';

export const createJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul lowongan wajib diisi.')
    .max(200, 'Judul lowongan maksimal 200 karakter.'),
  location: z
    .string()
    .trim()
    .min(1, 'Lokasi kerja wajib diisi.')
    .max(200, 'Lokasi kerja maksimal 200 karakter.'),
  salary: z
    .number({ error: 'Masukkan nominal gaji yang valid.' })
    .int('Gaji harus berupa bilangan bulat.')
    .min(0, 'Gaji tidak boleh negatif.')
    .max(2147483647, 'Gaji maksimal Rp2.147.483.647.'),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'], {
    error: 'Pilih jenis pekerjaan yang tersedia.',
  }),
  description: z
    .string()
    .trim()
    .max(10000, 'Deskripsi maksimal 10.000 karakter.')
    .optional(),
});

export type CreateJobFormValues = z.infer<typeof createJobSchema>;
