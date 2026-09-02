export type UserSeed = {
    name: string;
    email: string;
    password: string;
    facultyIndex: string;
};

const defaultPassword = 'Test12345!';

const names = [
    'Aid Ajkunic',
    'Alen Bejtic',
    'Amar Kosovac',
    'Armin Vlajcic',
    'Bakir Cinjarevic',
    'Dino Ruznic',
    'Emir Causevic',
    'Emir Saric',
    'Faris Omerbasic',
    'Harun Bajramovic',
    'Imran Vlajcic',
    'Jahja Hromadzic',
    'Lamija Zukan',
    'Nedim Ajdin',
    'Rasim Korajlic',
    'Tarik Mehmedovic',
] as const;

function emailForName(name: string): string {
    const localPart = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');

    return `${localPart}@etf.unsa.ba`;
}

export const userSeeds: UserSeed[] = names.map((name, index) => ({
    name,
    email: emailForName(name),
    password: defaultPassword,
    facultyIndex: `19${String(index + 1).padStart(3, '0')}`,
}));

export const professorEmail = emailForName('Bakir Cinjarevic');
export const restrictedExamEditorEmail = emailForName('Imran Vlajcic');
