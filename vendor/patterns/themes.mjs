// Theme derivation: course engine tokens -> the 16 pattern tokens (plus fonts).
// The kit patch (vendor/patches/pattern-block.diff) carries the same table as PATTERN_MAP;
// tests/pattern-contract.test.js fails if the two drift apart.
export const PATTERN_MAP = {
  '--bg': '--card', '--surface': '--card-2', '--surface-2': '--ground',
  '--ink': '--ink', '--ink-2': '--ink-2', '--muted': '--ink-3', '--line': '--rule',
  '--accent': '--link', '--on-accent': '--card', '--accent-soft': '--ground-2',
  '--good': '--ok', '--good-soft': '--ok-soft', '--bad': '--no', '--bad-soft': '--no-soft',
  '--warn': '--warn', '--warn-soft': '--warn-soft',
  '--font-body': '--body', '--font-display': '--display', '--font-sign': '--sign'
};

/** courseVars: {'--card': '#f6f6f1', ...} -> pattern vars */
export function derive(courseVars) {
  const out = {};
  for (const [k, v] of Object.entries(PATTERN_MAP)) if (courseVars[v]) out[k] = courseVars[v];
  return out;
}
