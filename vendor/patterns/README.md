# vendor/patterns

**What is here now is a SAMPLE catalogue**: six patterns numbered 901 to 906, written by
`scripts/make-sample-patterns.mjs` against the contract in `CONTRACT.md`. The numbers sit outside
the real catalogue's range so they can never be mistaken for real patterns.

The real 135-pattern catalogue lives in the Course Builder project doc
`claude/trust-pattern-builder-SKILL.md` (appendices) and its published pages. To vendor it:

1. Export `catalogue.json` and the pages into a folder laid out like this one
   (`catalogue.json`, `pages/<n>.html`), with each entry's `page` field pointing at its file.
2. `npm run vendor:diff -- patterns <that folder>` to see what would change.
3. `npm run vendor:diff -- patterns <that folder> --apply` then `npm run vendor:lock`.

If the real pages use a different adapter message shape, adjust `CONTRACT.md` and the engine patch
together (the lead owns that change). Do not edit pattern pages by hand.
