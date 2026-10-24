# DESIGN.md — Who Owed Due Care?

The approved outline lives in the user's doc "Who Owed Due Care? CISSP course outline". This file is the
working copy for authors.

## 1. Material and audience
- Source: SecureTree.ai CISSP deck (461 slides, 8 domains, concepts only, no cases). Each lesson pairs one
  deck concept with one real incident. The incident facts come from primary records, written into
  src/<id>.md by the research pass, with exact deck lines under FROM THE COURSE DECK.
- Learner: a practitioner preparing for the CISSP (five years' experience in two or more domains). They
  should leave able to spot, in a messy real scenario, where a principle was not followed and who was placed
  to apply it. They know the vocabulary; do not define basics like "firewall" or "patch".
- Voice: plain instructional English, short sentences, past tense for the record, second person for the
  learner. US spelling for US cases, UK spelling for UK cases (PSNI, Marriott ICO). No em dashes.
  Deck register: "Due Care is to act responsibly" (slide 18).

## 2. The eight questions (config.questions)
1 Who owns this, and who answers for it? (data/system owner; accountability vs responsibility, slides 11, 17)
2 Did we do the research before we took it on? (due diligence; M&A compromise assessments; suppliers, 15, 18, 51)
3 Does anyone hold more access than the job needs? (least privilege; authorization creep, 122)
4 Can one person do this alone? (separation of duties, 122)
5 Is it locked by default, and does it fail closed? (secure defaults; fail securely, 122)
6 If this layer fails, what stands behind it? (defense in depth, 121)
7 Even when we trust it, who verifies? (trust but verify; zero trust, 121)
8 Whose control is this: ours or the provider's? (shared responsibility, 121)

## 3. The signature object and what "stop" means here
- The emergency-stop button is the control. Ring: WHO OWED DUE CARE HERE?
- The learner places a control (a check, a verification, a revoked account, a block, a second pair of eyes)
  on the actor who was placed to apply it. Chain words in config.t say "control", never "stop button".
- Stamps: CONTROL PLACED / CONTROLS HELD / CAUGHT IN TIME / CASE CLOSED.
- Not blame: feedback on wrong nodes explains why that person was not placed to break the chain.
- Use `afterNote:false` where the downstream would still have happened (Log4Shell, Maersk).

## 4. The ladder (config.parts)
Parts 1 to 8 are the eight CISSP domains in exam order, boardroom to code: Decides, Holds, Builds, Connects,
Admits, Tests, Runs, Ships. Part 0 Start here, part 9 Closing. Each domain ends with an EXAM checkpoint.

## 5. Lesson map
| id | case · deck module | device | the error the learner commits | chain (CONTROL links) | Qs |
|---|---|---|---|---|---|
| ch01 | Uber cover-up 2016 · D1 ethics (6) | the CSO's inbox, ten days after FTC testimony | routes the hackers' demand as a bug-bounty payout; signature `order` who knew what when | hackers → CSO* → deputy → General Counsel, not told* → new CEO → disclosure | 1,4 |
| ch02 | Marriott/Starwood · D1 M&A (15) | the acquisition due-diligence checklist | leaves the reservation system off a time-boxed review; signature `sort`; slider years inside | Starwood IT → acquisition team* → integration → DB monitoring* → alert → ICO | 2,6 |
| ch03 | Maersk/NotPetya · D1 continuity | the recovery war room | assumes replicated domain controllers back each other up; signature `runaway` (by hand, then offline copy set first) | infection → flat network → no offline DC backup* → Ghana DC by accident → recovery team | 6 |
| ch04 | Morgan Stanley · D2 retention, disposal (106, 115) | the decommissioning work order | approves the mover already on contract; signature `order` the device's route to auction | decision → vendor selection* → mover resells → no destruction proof* → buyer → reconciliation | 2,8 |
| ch05 | PSNI spreadsheet · D2 classification, handling (99, 112) | the FOI response workbook | QA-checks the visible sheet and signs off; signature `tapfind` hidden tab | requester → export → tab deletion* → QA sign-off* → upload → officers spot it | 4,7 |
| ch06 | Mirai · D3 secure defaults (122) | the device's first-run setup screen (`popup`) | takes "skip, change later"; slider Krebs attack size | manufacturer* → installer/owner* → code published → operators → targets | 5 |
| ch07 | Storm-0558 · D3 key management (151) | the key register and the CSRB review | pauses rotation after it caused an outage; signature `tapfind` on a MailItemsAccessed log | key 2016 → rotation halted 2021* → validation flaw* → key obtained → State SOC → Microsoft | 7,1 |
| ch08 | Capital One · D3 shared responsibility (121) | the cloud responsibility matrix | files the firewall setting under "provider"; signature `sort` provider vs customer, then OCC order | migration without risk assessment* → engineers → alert handling* → audit/board → tipster | 8,3,2 |
| ch09 | TJX · D4 wireless (242) | the WPA upgrade project plan | defers the store Wi-Fi upgrade; signature `order` the timeline | IT leadership defers WPA* → store wireless → no firewall, clear text* → monitoring | 5,6 |
| ch10 | Target · D4 segmentation (267), supply chain (51) | the SOC alert console | lets an alert scroll past; signature `vigil` | vendor phished → portal not isolated* → lateral movement → alerts not acted on* → DOJ | 6,7 |
| ch11 | Colonial Pipeline · D5 provisioning lifecycle (329) | the quarterly access review form | keeps a legacy VPN profile nobody is sure about; signature `tapfind` on the review form | legacy profile left* → password-only VPN* → login → shutdown → ransom | 3,5 |
| ch12 | Twitter 2020 · D5 authentication (304) | a call from "the IT help desk" (imagined script) | follows the caller to a login page; signature `sort` who needs the admin tool | research → employees take call* → 1,000+ with tool access* → hijack → exchanges block | 3,7 |
| ch13 | CrowdStrike · D6 testing (339) | the test report and Content Validator result | writes tests that all use a wildcard in field 21; signature `runaway` crashed hosts, then staged rollout set first | devs 21 vs 20 → test engineers* → validator → release to all at once* → customers | 7,5 |
| ch14 | Equifax · D7 patching (370) | the patch notice to about 430 recipients | leaves it for whoever owns ACIS; signature `sort` the inbox; slider 76 days | US-CERT → outdated recipient list* → owner not told* → scans miss → expired certificate → attackers | 1,7,6 |
| ch15 | Knight Capital · D7 change/config (363, 365) EXEMPLAR | the deployment to eight servers | signs off without a second technician; signature `runaway` share counter, then threshold set first | devs → technician 7 of 8* → 97 emails* → rollback | 4,7 |
| ch16 | SolarWinds · D8 acquired software (461) | the signed vendor update | installs a signed update from a trusted vendor; signature `order` build-to-customer path; ED 21-01 | attackers in build → build/release unchecked* → customers install* → CISA | 7,8 |
| ch17 | Log4Shell · D8 ecosystems (98) | the dependency tree | answers "we don't use Log4j" before checking; signature `tapfind` in a dependency file (imagined) | maintainers 2013 → researcher → Apache fixes → orgs with no inventory* | 8,1 |

Checkpoints cp1..cp8: replay each case of the domain as its skinned exhibit, recall the control and the
question, then 2 or 3 imagined exam-style scenarios (labelled imagined) answered from the deck lines.
Intro: the eight questions first-run. Closing: controls that worked (State's alert rule, WDTK pulling the
PSNI file, exchanges blocking the scam addresses).

## 6. Exhibit inventory
See the outline doc. Skins: regulator orders and review boards → `filing`; agency alerts, forms, work
orders, access reviews → `form`; automated alerts and logs → `log`; spreadsheets, dependency files → `file`;
emails → `email`; device setup → `popup`; phone calls → `call` (imagined script); company statements →
`letter`. Never `card` or `memo` for an object the record names.

## 7. Theme
Engine palette. Parts 6 to 8 use the new --p6 plum, --p7 steel, --p8 olive tokens. Red and yellow only
for stop.

## 8. Risks to watch
Obey each src file's CAUTIONS. In particular: SolarWinds allegations dismissed (no individual blame);
Maersk Ghana story is reported by Wired, label it; Target alerts via Bloomberg in the Senate report, never
"110 million"; Capital One uses OCC wording; Equifax use one affected figure; Uber sentence was probation;
PSNI show structure only, no names; Marriott fined only for the GDPR period; CSRB does not blame Log4j
maintainers; Mirai defendants not charged for Dyn. Deck quotes stay short (McGraw Hill copyright).
