# Research brief (concept-only sources)

Use when the source teaches concepts but has no cases (a training deck, a standard, a policy set). Each
lesson then pairs one concept from the source with one real, publicly documented incident. Spawn one
research agent per 5 or 6 cases, all in one message, with this brief and their case list.

## Pass 1: verify (reply in under 1,400 words)
For each case:
- one-line summary and the control or principle it turns on
- 4 to 8 key verified facts (dates, numbers, exact short quotations), each with its source URL
- the actor chain: 3 to 7 real actors or decisions in order, marking the 1 or 2 links where the source
  says a control (check, verify, revoke, block) could have broken it
- the real documents in the record that could be exhibits, and the fields the source gives
- facts that are disputed, secondary-only, sensitive or easy to over-claim

Primary sources first: regulator orders, court filings, government review boards (GAO, CSRB, Senate or
House reports), official testimony, company root-cause analyses. Flag secondary facts. Say "not found"
rather than guess. If a site is blocked, try an official mirror and say which one you read.

## Pass 2: write the fact base
Continue the same agents (they hold the sources) and have each write src/<id>.md exactly as
briefs/SRC_FORMAT.md specifies, using the framing question you give per lesson, verbatim. The framing
question must appear in the file (static_eval F4 checks it).

## Then the lead
Append to each src file a section quoting the source material exactly (for a deck: "FROM THE COURSE DECK",
one line per slide quote with its slide number), and verify every quote against the raw text with
tools/quote_check.py. Lessons may quote only what is in src.

## Lessons paid for
- Agents' first summaries contained wrong premises from the brief itself (wrong tool names, rounded
  figures, a "45.6 million" not in any primary source). Ask them to flag where your brief was wrong.
- Allegations later dismissed (SolarWinds) and contested blame (Equifax) need explicit CAUTIONS.
- Keep figures in the src as the source writes them ("about 45 minutes", "fewer than 18,000").
