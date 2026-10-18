import { describe, expect, it } from 'vitest';

import { createJobSchema } from '@/pages/company/createJob.schema';

const validJob = {
  title: 'Frontend Developer',
  location: 'Jakarta',
  salary: 8500000,
  jobType: 'FULL_TIME',
};

describe('createJobSchema', () => {
  it('trims text and accepts zero rupiah without treating it as missing', () => {
    const result = createJobSchema.parse({
      ...validJob,
      title: '  Frontend Developer  ',
      location: '  Jakarta  ',
      salary: 0,
      description: '  Build accessible interfaces.  ',
    });

    expect(result).toEqual({
      ...validJob,
      salary: 0,
      description: 'Build accessible interfaces.',
    });
  });

  it.each([
    ['blank', ''],
    ['missing', undefined],
    ['not a number', Number.NaN],
    ['negative', -1],
    ['fractional', 1000.5],
    ['outside the PostgreSQL integer range', 2147483648],
  ])('rejects a %s salary', (_description, salary) => {
    const result = createJobSchema.safeParse({ ...validJob, salary });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['salary']);
    }
  });

  it('accepts the maximum salary supported by the API', () => {
    expect(
      createJobSchema.safeParse({ ...validJob, salary: 2147483647 }).success,
    ).toBe(true);
  });

  it.each(['title', 'location'])(
    'validates the %s length after trimming',
    (field) => {
      expect(
        createJobSchema.safeParse({ ...validJob, [field]: '   ' }).success,
      ).toBe(false);
      expect(
        createJobSchema.safeParse({ ...validJob, [field]: 'a'.repeat(200) })
          .success,
      ).toBe(true);
      expect(
        createJobSchema.safeParse({ ...validJob, [field]: 'a'.repeat(201) })
          .success,
      ).toBe(false);
    },
  );

  it.each(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'])(
    'accepts the documented %s job type',
    (jobType) => {
      expect(createJobSchema.safeParse({ ...validJob, jobType }).success).toBe(
        true,
      );
    },
  );

  it('rejects unknown job types and descriptions longer than the API limit', () => {
    expect(
      createJobSchema.safeParse({ ...validJob, jobType: 'REMOTE' }).success,
    ).toBe(false);
    expect(
      createJobSchema.safeParse({
        ...validJob,
        description: 'a'.repeat(10001),
      }).success,
    ).toBe(false);
  });
});
