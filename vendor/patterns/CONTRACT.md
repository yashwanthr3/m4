# Pattern page contract (as consumed by Trust Course Studio)

A catalogue page holds one `<section class="pattern" data-n data-theme data-gesture data-mechanic>`.
It must be self-contained (works inside an `iframe srcdoc` with CSP `default-src 'none'`, inline
script and style only) and include the theme adapter, which:

- accepts `{type:'trust-theme', vars, theme, only}` from the parent and sets each var on `:root`;
- posts `{type:'trust-height', h, n}` whenever its height changes;
- exposes `window.trustGate(event)`, which posts `{type:'trust-pattern', event, n}`. The page calls it
  when its Remember card (or, for specialists, its debrief) appears. The course engine treats that
  message as the gate.
- exposes `window.__autoplay('right'|'wrong')` for the studio's pattern contract check.

Colours come only from the 16 tokens: `--bg --surface --surface-2 --ink --ink-2 --muted --line --accent
--on-accent --accent-soft --good --good-soft --bad --bad-soft --warn --warn-soft` (plus `--font-body`,
`--font-display`, `--font-sign`). `themes.mjs` derives them from the course palette.
