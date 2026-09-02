# Assignment seed attachments

Put files used by `src/database/seed.ts` assignment seeding here.

Recommended layout:

```txt
src/database/seed-assets/assignments/
  sorting-lab/
    instructions.pdf
    starter-code.zip
  graph-traversal/
    assignment.pdf
    graph-inputs.zip
```

Seed code can resolve files relative to the API package root, for example:

```ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const assignmentSeedAssetsDir = join(
  process.cwd(),
  'src/database/seed-assets/assignments',
)

const buffer = await readFile(
  join(assignmentSeedAssetsDir, 'sorting-lab/instructions.pdf'),
)
```

When adding an attachment to an assignment, upload the file to storage first, then insert its metadata into the assignment files table using the returned storage key.
