import { mkdirSync, writeFileSync } from 'node:fs'

// Keep file count constant for the fixed/per-test performance estimate.
mkdirSync(new URL('./generated/', import.meta.url), { recursive: true })
for (let file = 0; file < 30; file++) {
  writeFileSync(new URL(`./generated/file-${String(file).padStart(2, '0')}.test.js`, import.meta.url),
    `import { suite } from '../suite.js'\nsuite(${file})\n`)
}
console.log('HARNESS_GENERATED 30 files; large=1650 executed+30 skipped; small=330 executed+30 skipped')
