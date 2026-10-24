# Judge rubric: lesson quality

Used by a reviewer who did not write the lesson. Read the manuscript chapter (`src/<id>.md`)
first, then the lesson file (`lessons/<id>.js`), then the phone screenshots in `eval/shots/<id>/`.
Score each dimension 1 to 5 using the anchors. Bar to ship: **every dimension 4 or higher, mean 4.3+**.

| # | Dimension | 5 looks like | 3 looks like | 1 looks like |
|---|---|---|---|---|
| J1 | **Faithful** | Every fact, number, name and quotation matches the chapter; paraphrase and imagined scenes are labelled; nothing the chapter doesn't support | One soft overstatement or an unlabelled paraphrase | Invented quote, wrong number, or a claim the source doesn't make |
| J2 | **Experiential** | The learner commits to a call before being told, and the mechanic makes them *feel* the failure's mechanism (they over-trust, they miss, they let it run) | Interactions exist but are quiz questions about the text | Mostly reading; clicks only advance |
| J3 | **Sits with you** | At least one moment turns the case onto the learner's own life, using their own earlier answer or words; the final question lingers | Generic reflection prompt, not tied to what they did | No reflection |
| J4 | **Feedback teaches** | Every wrong path explains why a reasonable person would choose it and what it costs; no shaming; right answers add something new | Feedback mostly restates right/wrong | Bare "correct/incorrect" |
| J5 | **True to the chapter's form** | The lesson's structure *is* the chapter's narrative device (obituary, route, recipe, ledger…) and carries its central argument and the who-could-have-said-stop analysis | Device named but the lesson is a generic quiz | Unrelated structure |
| J6 | **Clear, in the source's voice** | Plain, short, concrete sentences a non-technical reader follows at once; no jargon left undefined; no filler | Some long or abstract passages | Confusing or padded |
| J7 | **Transfer** | Ends with a concrete thing the learner can do this week, from the chapter's advice, practised once in the lesson | Advice stated but not practised | No takeaway |
| J8 | **Craft** | Pacing feels like Brilliant: one idea per screen, satisfying reveals, no dead screens, varied mechanics, renders cleanly | Uneven pacing or a cramped/empty screen | Broken or tedious |

Output for each lesson: the eight scores, mean, PASS/REVISE, and for anything under 5 the specific
fix (step and block, what to change, why). Fixes must be concrete enough to apply without rereading
the rubric.
