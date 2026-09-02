import type { faculties } from '@/database/schemas/faculties.schema';

export type FacultySeed = Omit<typeof faculties.$inferInsert, 'id' | 'createdById'> & {
    id: string;
};

export const facultySeeds: FacultySeed[] = [
    {
        id: '00000000-0000-4000-8000-000000000010',
        name: 'Elektrotehnički fakultet',
        code: 'ETF',
    },
];
