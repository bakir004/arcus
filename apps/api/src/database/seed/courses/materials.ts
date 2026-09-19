import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { db } from '@/database/client';
import { courseGroups, courseMaterials } from '@/database/schemas/course-materials.schema';
import { eq } from 'drizzle-orm';

const aspCourseId = '00000000-0000-4000-8000-000000000003';
const diskretnaCourseId = '00000000-0000-4000-8000-000000000001';
const assignmentsDir = path.resolve(__dirname, '../assets/assignments');
const bucket = 'arcus';

const diskretnaGroups = [
    ['00000000-0000-4000-8000-000000001101', 'Opšte', 'Obavijesti i osnovne informacije o kursu.'],
    ['00000000-0000-4000-8000-000000001102', 'Predavanja', 'Materijali za predavanja.'],
    ['00000000-0000-4000-8000-000000001103', 'Dodaci predavanjima', 'Dodatna pojašnjenja i korisni materijali.'],
    [
        '00000000-0000-4000-8000-000000001104',
        'Riješeni zadaci uz predavanja',
        'Detaljno riješeni zadaci za bolje savladavanje gradiva.',
    ],
    ['00000000-0000-4000-8000-000000001105', 'Kvizovi', 'Sedmične provjere i obavijesti o kvizovima.'],
    ['00000000-0000-4000-8000-000000001106', 'Laboratorijske vježbe', 'Upute i obavijesti za laboratorijske vježbe.'],
    ['00000000-0000-4000-8000-000000001107', 'Zadaci za samostalno vježbanje', 'Zadaci za samostalan rad.'],
    ['00000000-0000-4000-8000-000000001108', 'Zadaće', 'Upute i materijali za zadaće.'],
    ['00000000-0000-4000-8000-000000001109', 'Primjeri ispita', 'Primjeri ranijih ispita i priprema.'],
].map(([id, name, description]) => ({ id, name, description })) as readonly {
    id: string;
    name: string;
    description: string;
}[];

const groups = [
    {
        id: '00000000-0000-4000-8000-000000001001',
        name: 'Lectures and notes',
        description: 'Lecture notes and reference material.',
    },
    {
        id: '00000000-0000-4000-8000-000000001002',
        name: 'Laboratory exercises',
        description: 'Exercises and starter projects for the laboratory sessions.',
    },
    {
        id: '00000000-0000-4000-8000-000000001003',
        name: 'Practice and assessment',
        description: 'Additional practice material and previous assessments.',
    },
] as const;

const files = [
    ['predavanje 1.pdf', 'Lecture 1: Introduction to algorithms', groups[0].id],
    ['ARM vjezba 22025.pdf', 'ARM architecture notes', groups[0].id],
    ['README.md', 'Laboratory repository README', groups[0].id],
    ['Application.cpp', 'C++ application example', groups[1].id],
    ['main.c', 'C starter example', groups[1].id],
    ['python.py', 'Python algorithm examples', groups[1].id],
    ['test.sql', 'SQL test data', groups[1].id],
    ['graph.png', 'Graph data structure diagram', groups[1].id],
    ['Vježba 2 - Zadatak 2 - Upute.html', 'Exercise 2 instructions', groups[1].id],
    ['UUP_AE12a_LV13.zip', 'Practice project starter files', groups[1].id],
    ['Dodatak vježbi 5 (1).txt', 'Additional exercise notes', groups[2].id],
    ['zavrsni_juni_v1.pdf', 'Previous final exam', groups[2].id],
    ['video 1.mp4', 'Algorithm walkthrough video', groups[2].id],
] as const;

const nonFileMaterials = [
    {
        id: '00000000-0000-4000-8000-000000003001',
        courseGroupId: groups[0].id,
        position: 3,
        kind: 'TEXT' as const,
        textContent:
            '## Algorithm design checklist\n\nStart by defining the input and output, then choose a data structure and estimate the complexity of the solution.',
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000003002',
        courseGroupId: groups[0].id,
        position: 4,
        kind: 'LINK' as const,
        textContent: null,
        title: 'VisuAlgo algorithm visualizations',
        description: 'Interactive visualizations for sorting, graphs, and data structures.',
        externalUrl: 'https://visualgo.net/en',
    },
    {
        id: '00000000-0000-4000-8000-000000003004',
        courseGroupId: groups[0].id,
        position: 5,
        kind: 'TEXT' as const,
        textContent: [
            '# Markdown showcase',
            '',
            'This paragraph contains **bold text**, *italic text*, ***bold italic text***, ~~strikethrough~~, and `inline code`.',
            '',
            'A [regular link](https://example.com), an autolink <https://example.com>, and an escaped character: \\*not italic\\*.',
            '',
            'A hard line break follows this sentence.  ',
            'This starts on the next line.',
            '',
            '## Blockquote',
            '',
            '> Good algorithms are built by understanding the problem first.',
            '>',
            '> > Nested quotations work too.',
            '',
            '## Lists',
            '',
            '- Unordered item',
            '- Another item',
            '  - Nested item',
            '  - Another nested item',
            '',
            '1. First ordered item',
            '2. Second ordered item',
            '3. Third ordered item',
            '',
            '### Task list',
            '',
            '- [x] Read the requirements',
            '- [x] Design the solution',
            '- [ ] Implement the remaining feature',
            '',
            '## Table',
            '',
            '| Algorithm | Average | Worst |',
            '| :-------- | ------: | ----: |',
            '| Merge sort | O(n log n) | O(n log n) |',
            '| Quick sort | O(n log n) | O(n²) |',
            '| Linear search | O(n) | O(n) |',
            '',
            '## Code',
            '',
            '```typescript',
            'type Result = { value: number };',
            '',
            'function double(value: number): Result {',
            '    return { value: value * 2 };',
            '}',
            '',
            'console.log(double(21));',
            '```',
            '',
            '```',
            'A fenced code block without a language.',
            '```',
            '',
            '## Image',
            '',
            '![Markdown preview placeholder](https://placehold.co/600x160?text=Markdown+Image)',
            '',
            '---',
            '',
            '#### Heading level four',
            '##### Heading level five',
            '###### Heading level six',
        ].join('\n'),
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000003003',
        courseGroupId: groups[2].id,
        position: 3,
        kind: 'TEXT' as const,
        textContent:
            'Use the previous exam as practice: write down the expected complexity before implementing each solution.',
        title: null,
        description: null,
        externalUrl: null,
    },
] as const;

function mimeType(fileName: string) {
    const extension = path.extname(fileName).toLowerCase();
    return (
        {
            '.pdf': 'application/pdf',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.cpp': 'text/x-c++src',
            '.c': 'text/x-c',
            '.py': 'text/x-python',
            '.sql': 'application/sql',
            '.png': 'image/png',
            '.zip': 'application/zip',
            '.mp4': 'video/mp4',
        }[extension] ?? 'application/octet-stream'
    );
}

async function uploadSeedFile(client: S3Client, fileName: string, index: number, prefix = 'asp') {
    const body = await readFile(path.join(assignmentsDir, fileName));
    const key = `course-materials/seed/${prefix}/${String(index + 1).padStart(2, '0')}-${fileName}`;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: mimeType(fileName) }));
    return { key, size: body.byteLength };
}

export async function seedAspMaterials(uploadedById: string) {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKeyId = process.env.MINIO_ACCESS_KEY;
    const secretAccessKey = process.env.MINIO_SECRET_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey)
        throw new Error('MinIO configuration is required to seed course materials');

    const storage = new S3Client({
        endpoint,
        region: 'us-east-1',
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
    });

    await storage.send(new CreateBucketCommand({ Bucket: bucket })).catch((error: { Code?: string }) => {
        if (error.Code !== 'BucketAlreadyOwnedByYou' && error.Code !== 'BucketAlreadyExists') throw error;
    });

    await db.transaction(async (transaction) => {
        // Replace the ASP fixture so this remains safe when older seed data used different IDs.
        await transaction.delete(courseGroups).where(eq(courseGroups.courseId, aspCourseId));

        for (const [position, group] of groups.entries()) {
            await transaction.insert(courseGroups).values({ ...group, courseId: aspCourseId, position });
        }

        const groupPositions = new Map<string, number>();
        for (const [position, [fileName, title, courseGroupId]] of files.entries()) {
            const materialPosition = groupPositions.get(courseGroupId) ?? 0;
            groupPositions.set(courseGroupId, materialPosition + 1);
            const uploaded = await uploadSeedFile(storage, fileName, position);
            await transaction
                .insert(courseMaterials)
                .values({
                    id: `00000000-0000-4000-8000-${String(2001 + position).padStart(12, '0')}`,
                    uploadedById,
                    courseGroupId,
                    position: materialPosition,
                    kind: 'FILE',
                    title,
                    description: `Seed material: ${fileName}`,
                    fileKey: uploaded.key,
                    fileName,
                    fileMimeType: mimeType(fileName),
                    fileSize: uploaded.size,
                })
                .onConflictDoUpdate({
                    target: courseMaterials.id,
                    set: {
                        courseGroupId,
                        position: materialPosition,
                        title,
                        description: `Seed material: ${fileName}`,
                        fileKey: uploaded.key,
                        fileName,
                        fileMimeType: mimeType(fileName),
                        fileSize: uploaded.size,
                        updatedAt: new Date(),
                    },
                });
        }

        for (const material of nonFileMaterials) {
            await transaction
                .insert(courseMaterials)
                .values({ ...material, uploadedById })
                .onConflictDoUpdate({
                    target: courseMaterials.id,
                    set: {
                        courseGroupId: material.courseGroupId,
                        position: material.position,
                        kind: material.kind,
                        textContent: material.textContent,
                        title: material.title,
                        description: material.description,
                        externalUrl: material.externalUrl,
                        fileKey: null,
                        fileName: null,
                        fileMimeType: null,
                        fileSize: null,
                        updatedAt: new Date(),
                    },
                });
        }
    });

    console.log(`Seeded ${files.length} ASP file materials and ${nonFileMaterials.length} text/link materials`);
}

type DiskretnaSeedFile = readonly [fileName: string, title: string, courseGroupId: string, description?: string];

const diskretnaRulesDescription =
    'U ovom dokumentu nalaze se detaljna pravila rada i ocjenjivanja na kursu za ovu akademsku godinu, koja vrijede za sve studente, UKLJUČUJUĆI I PONOVCE. Od studenata se očekuje da detaljno prouče ova pravila PRIJE PRVOG PREDAVANJA. Predmetni nastavnici NEĆE ODGOVARATI NA EMAILOVE U KOJIMA SE POSTAVLJAJU PITANJA NA KOJE SE ODGOVOR NALAZI U OVOM DOKUMENTU!';

const diskretnaSpecialFiles: readonly DiskretnaSeedFile[] = [
    [
        'README.md',
        'Pravila rada na kursu "Tehnike programiranja" za akademsku 2025/26 godinu (OBAVEZNO PROČITATI)',
        diskretnaGroups[0].id,
        diskretnaRulesDescription,
    ],
    ['README.md', 'Pregled tematskih jedinica po predavanjima', diskretnaGroups[0].id],
    ['README.md', 'Nastavni plan i program', diskretnaGroups[0].id],
    ['README.md', 'Rezultati I parcijalnog ispita (11. IX)', diskretnaGroups[0].id],
    ['README.md', 'Rezultati II parcijalnog ispita (11. IX)', diskretnaGroups[0].id],
    ['README.md', 'KO IMA PRAVO IZAĆI NA USMENI ISPIT I POD KOJIM UVJETIMA (11. IX)', diskretnaGroups[0].id],
];

const diskretnaFileTitles = [
    ...Array.from({ length: 14 }, (_, index) => `Predavanje ${index + 1}_a`),
    ...Array.from({ length: 14 }, (_, index) => `Predavanje ${index + 1}_b`),
    'Dodatak: Imenici, biblioteke i zaglavlja - (Razjašnjenja nekih nedoumica)',
    'Dodatak: Korektan tretman znakova bosanskog jezika prilikom ispisa teksta na ekran',
    'Dodatak (OBAVEZNO PROČITATI): Zablude o izrazima s bočnim efektima',
    'Dodatak (OBAVEZNO PROČITATI): Šokantna priča o realnoj aritmetici',
    'Dodatak (OBAVEZNO PROČITATI): Prekoračenja i nepredznačna aritmetika',
    'Dodatak: Sve što treba znati o pokazivačima (a što vam mama nije rekla)',
    'Poučna priča: Kako je propalo Rimsko carstvo',
    'SF pričica - Da li je "}" kraj?',
    'Dodatak: Primjer objektno orijentiranog razvoja (ili zašto je objektno orijentirano programiranje značajno)',
    '[TP 2025-26] Poučni tekst - Utjecaj opsega ulaznih podataka na rješenje problema u programiranju',
    ...Array.from({ length: 14 }, (_, index) => `Riješeni zadaci uz Predavanje ${index + 1}`),
    ...Array.from({ length: 13 }, (_, index) => `Zadaci za samostalno vježbanje ${index + 1}`),
    ...Array.from({ length: 5 }, (_, index) => `Zadaća ${index + 1}`),
    ...Array.from({ length: 3 }, (_, index) => `I parcijalni ispit - Primjer ${index + 1}`),
    ...Array.from({ length: 19 }, (_, index) => `II parcijalni ispit - Primjer ${index + 1}`),
] as const;

const diskretnaFiles: readonly DiskretnaSeedFile[] = [
    ...diskretnaSpecialFiles,
    ...diskretnaFileTitles.map(
        (title, index) =>
            [
                'README.md',
                title,
                index < 28
                    ? diskretnaGroups[1].id
                    : index < 38
                      ? diskretnaGroups[2].id
                      : index < 52
                        ? diskretnaGroups[3].id
                        : index < 65
                          ? diskretnaGroups[6].id
                          : index < 70
                            ? diskretnaGroups[7].id
                            : diskretnaGroups[8].id,
            ] as const,
    ),
];

const diskretnaMaterials = [
    {
        id: '00000000-0000-4000-8000-000000005001',
        courseGroupId: diskretnaGroups[0].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `![Reforma obrazovanja](https://c2.etf.unsa.ba/pluginfile.php/80628/mod_label/intro/Reforma%20obrazovanja.jpg)

# DOBRODOŠLI NA KURS
## "TEHNIKE PROGRAMIRANJA"

Za sva pitanja, probleme, nejasnoće itd. u vezi kursa (a i drugih stvari) možete se obratiti predmetnim nastavnicima lično ili putem e-maila zjuric@etf.unsa.ba (red. prof. dr Željko Jurić) i senka.krivic@etf.unsa.ba (doc. dr Senka Krivić).

PROFESOR: Dragi studenti, šta mislite šta je veće zlo, neznanje ili nezainteresiranost?
STUDENTI: Ne znamo i ne interesira nas...

The only universal rule is that there are no universal rules.

Pravila rada na kursu "Tehnike programiranja" za akademsku 2025/26 godinu (OBAVEZNO PROČITATI)

Pregled tematskih jedinica po predavanjima

Nastavni plan i program

[Muzička podloga za spremanje TP-a](https://www.youtube.com/watch?v=P_LE1nVS9iY)  
[Dodatna muzička podloga za spremanje TP-a](https://www.youtube.com/watch?v=8joN7zM3Aec)  
[Muzička podloga za spremanje TP-a za najambicioznije studente](https://www.youtube.com/watch?v=SO08DnW2GeM)

ANKETA ZA PRENOŠENJE POENA ZA STUDENTE PONOVCE

Rezultati I parcijalnog ispita (11. IX)

Rezultati II parcijalnog ispita (11. IX)

KO IMA PRAVO IZAĆI NA USMENI ISPIT I POD KOJIM UVJETIMA (11. IX)`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005015',
        courseGroupId: diskretnaGroups[0].id,
        position: 4,
        kind: 'LINK' as const,
        textContent: null,
        title: 'ANKETA ZA PRENOŠENJE POENA ZA STUDENTE PONOVCE',
        description: null,
        externalUrl: 'https://c2.etf.unsa.ba/mod/url/view.php?id=105222',
    },
    {
        id: '00000000-0000-4000-8000-000000005003',
        courseGroupId: diskretnaGroups[1].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `Svi oni koji tvrde da predmetni nastavnici u predavanja ubacuju tematske cjeline koje nisu predviđene važećim nastavnim planom i programom, mogu važeći nastavni plan i program pogledati ovdje.

Pored predavanja koja će se držati uživo, studentima su dostupni i video zapisi predavanja prof. dr. Željka Jurića od prije pet akademskih godina, snimanih za vrijeme Covid pandemije za potrebe online nastave i preslušavanje u slobodno vrijeme.

Snimci se nalaze na Google Drive-u, kojem se može pristupiti pomoću sljedećeg linka (obavezna je prijava putem etf-ove email adrese):`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005004',
        courseGroupId: diskretnaGroups[2].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `U ovoj sekciji, nalaziće se razni dodaci uz predavanja, koji imaju dvojaku ulogu. Neki od dodataka sadrže informacije koje je iznimno korisno znati za buduće bavljenje programiranjem, a koji zbog nedostatka prostora nisu mogle biti obrađene u okviru predavanja. S druge strane, neki od dodataka sadrže dodatna pojašnjenja nekih stvari za koje je primijećeno da studenti imaju problema s njihovim razumijevanjem.`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005005',
        courseGroupId: diskretnaGroups[3].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `O nekim od riješenih zadataka u ovoj sekciji diskutiraće se s asistentima ili demonstatorima u toku laboratorijskih vježbi, a neki zadaci su ostavljeni kao bonus zadaci.

Uštedite novac za instrukcije: Mnogi zadaci koji se objavljuju i koji će se ubuduće objavljivati u ovoj sekciji su bili ispitni zadaci, ili varijacije na temu ispitnih zadataka, a ovdje su detaljno riješeni i temeljito objašnjeni upravo od strane predmetnog nastavnika.`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005006',
        courseGroupId: diskretnaGroups[4].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `Kvizovi će se održavati svake sedmice osim prve, ponedjeljkom u 19:00 (prvi termin), ili u 22:00 (alternativni termin), tako da je prvi kviz u ponedjeljak, 9. III 2026. Svaki kviz se odnosi na gradivo prethodne sedmice.

Kviz se sastoji od 5 nasumično odabranih pitanja abcd tipa, a radi se 3 minute. Svaki kviz nosi maksimalno 0.5 poena.`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005007',
        courseGroupId: diskretnaGroups[5].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `Laboratorijske vježbe počinju od druge sedmice nastave. Vježbe se rade u laboratoriji i rade se u jednom bloku od 90 minuta, bez pauza.

VAŽNO: Studenti ne smiju da se samoinicijativno prebacuju iz grupe u grupu bez odobrenja predmetnog nastavnika.`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005008',
        courseGroupId: diskretnaGroups[7].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `VAŽNA NAPOMENA:

Prilikom izrade zadataka, ne smiju se koristiti tipovi podataka i/ili funkcije koji nisu rađeni na predavanjima do isteka vremena za predaju zadaće, ili na kursu OR/UUP.

VEOMA VAŽNE NAPOMENE:

Zadaća se isključivo šalje kroz C9/Theia okruženje.`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005009',
        courseGroupId: diskretnaGroups[8].id,
        position: 0,
        kind: 'TEXT' as const,
        textContent: `U ovoj rubrici dati su neki primjeri ispita, koji zapravo predstavljaju uzorke nekih ranijih ispita. Ne mora značiti da će sadašnji ispit također imati istu strukturu, niti da će imati istu šemu bodovanja.`,
        title: null,
        description: null,
        externalUrl: null,
    },
    {
        id: '00000000-0000-4000-8000-000000005010',
        courseGroupId: diskretnaGroups[1].id,
        position: 1,
        kind: 'LINK' as const,
        textContent: null,
        title: 'Google Drive - video zapisi predavanja',
        description: 'Snimci predavanja od Predavanja 3_b do Predavanja 14_b.',
        externalUrl: 'https://drive.google.com/drive/folders/1pHrG8GqZIHw5gqIzFbOd4So2_4kc_2-W?usp=sharing',
    },
    {
        id: '00000000-0000-4000-8000-000000005011',
        courseGroupId: diskretnaGroups[5].id,
        position: 1,
        kind: 'LINK' as const,
        textContent: null,
        title: 'Prijava u grupe za ponovce',
        description: 'Putem ovog obrasca možete se prijaviti u jednu od 6 grupa predviđenih za ponovce.',
        externalUrl: 'https://c2.etf.unsa.ba/course/view.php?id=76',
    },
    {
        id: '00000000-0000-4000-8000-000000005012',
        courseGroupId: diskretnaGroups[5].id,
        position: 2,
        kind: 'LINK' as const,
        textContent: null,
        title: 'Pristupni link (Google Meet) za izvođenje nadoknade laboratorijske vježbe',
        description: 'LV 13 - Grupa EE1-1a',
        externalUrl: 'https://meet.google.com/qcm-zbjs-ofm',
    },
] as const;

export async function seedDiskretnaMaterials(uploadedById: string) {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKeyId = process.env.MINIO_ACCESS_KEY;
    const secretAccessKey = process.env.MINIO_SECRET_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey)
        throw new Error('MinIO configuration is required to seed course materials');

    const storage = new S3Client({
        endpoint,
        region: 'us-east-1',
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
    });
    await storage.send(new CreateBucketCommand({ Bucket: bucket })).catch((error: { Code?: string }) => {
        if (error.Code !== 'BucketAlreadyOwnedByYou' && error.Code !== 'BucketAlreadyExists') throw error;
    });

    await db.transaction(async (transaction) => {
        await transaction.delete(courseGroups).where(eq(courseGroups.courseId, diskretnaCourseId));
        for (const [position, group] of diskretnaGroups.entries()) {
            await transaction.insert(courseGroups).values({ ...group, courseId: diskretnaCourseId, position });
        }
        const groupPositions = new Map<string, number>();
        for (const [index, [fileName, title, courseGroupId, description]] of diskretnaFiles.entries()) {
            const position = groupPositions.get(courseGroupId) ?? 0;
            groupPositions.set(courseGroupId, position + 1);
            const uploaded = await uploadSeedFile(storage, fileName, index, 'diskretna');
            await transaction.insert(courseMaterials).values({
                id: `00000000-0000-4000-8000-${String(4001 + index).padStart(12, '0')}`,
                uploadedById,
                courseGroupId,
                position,
                kind: 'FILE',
                title,
                description: description ?? `Materijal za predmet Diskretna matematika (${fileName})`,
                fileKey: uploaded.key,
                fileName,
                fileMimeType: mimeType(fileName),
                fileSize: uploaded.size,
            });
        }
        for (const material of diskretnaMaterials) {
            const position = groupPositions.get(material.courseGroupId) ?? 0;
            groupPositions.set(material.courseGroupId, position + 1);
            await transaction.insert(courseMaterials).values({ ...material, position, uploadedById });
        }
    });
    console.log(
        `Seeded ${diskretnaFiles.length} Diskretna file materials and ${diskretnaMaterials.length} text/link materials`,
    );
}
