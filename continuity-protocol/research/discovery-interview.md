# Continuity Discovery Interview

**Goal: Find out whether people are already inventing their own Continuity Receipts — without knowing it.**

This is not a sales call. You are not pitching CPS-0001. You are researching whether a problem exists that no one has a common language for yet.

---

## Rules

1. **Do not mention CPS-0001, Continuity Protocol, MyShape, or receipts for the first 80% of the conversation.**
2. Ask open-ended questions. "How do you…" not "Do you need…"
3. The most valuable answer is "We built our own thing for that." That's the signal.
4. Take notes. After 20 interviews, you're looking for patterns — not individual answers.

---

## Phase 1 — Context (5 min)

Don't ask about "continuity." Ask about their data.

| # | Question | What you're listening for |
|:---|:---|:---|
| 1.1 | What kind of sensor data does your system work with? (IMU, camera, lidar, encoder, heart rate, eye tracking, etc.) | Do they have continuous sensor data at all? If no, this interview is likely not a match. |
| 1.2 | How fast is this data coming? Once per second? 60 times per second? | High-frequency data has more continuity signal. |
| 1.3 | How long does a typical session or task last? Seconds? Minutes? Hours? | Longer sessions → more continuity risk. |

---

## Phase 2 — Data Flow (5 min)

Find whether their data crosses system boundaries.

| # | Question | Signal |
|:---|:---|:---|
| 2.1 | Does this sensor data stay in one system, or does it move between systems? | If data stays in one place, continuity may not matter to them. |
| 2.2 | When it moves, what information gets lost along the way? | They might describe exactly the problem CPS-0001 solves — without knowing it. |
| 2.3 | How do you know the data you received is the same data that was sent? | Are they checking integrity? If so, how? |

---

## Phase 3 — The Continuity Signal (5 min)

This is the core. Listen carefully.

| # | Question | Signal |
|:---|:---|:---|
| 3.1 | Have you ever had a situation where you needed to prove that data from time A and data from time B came from the same source — same device, same session, same person? | Direct continuity need. |
| 3.2 | How did you prove it? Or did you just not prove it? | If they say "we just trust it" → no pain. If they describe a workaround → high pain. |
| 3.3 | Is there a moment you look back and think "if we had a way to prove that data was continuous, it would have saved us"? | This is the money question. A specific story = strong evidence. |

---

## Phase 4 — The Gap (3 min)

| # | Question | Signal |
|:---|:---|:---|
| 4.1 | Is there something you wish existed that would make handling continuous sensor evidence easier? | If they describe a protocol object → jackpot. |
| 4.2 | Have you ever built something internally to handle this — even a simple format or convention? | "We invented our own" = the problem is real. |

---

## Phase 5 — Reveal (2 min)

Only now do you mention CPS-0001.

| # | What you say |
|:---|:---|
| 5.1 | "There's a research group that's been working on a standard way to express 'this sensor data comes from a continuous, unbroken observation session.' It doesn't identify who — it proves that the data wasn't tampered with or replaced across time. Would something like that be useful in your world?" |
| 5.2 | "Would you be willing to look at a one-page spec and tell me if it maps to anything you've encountered?" |

---

## After the Interview

Fill this out immediately:

```
Date:
Person/Role:
Company/Project:
Domain: [ ] Robotics  [ ] XR  [ ] Wearables  [ ] Industrial  [ ] Agent/AI  [ ] Security  [ ] Medical  [ ] Other

Has continuous sensor data:   [ ] Yes  [ ] No
Data crosses system boundary: [ ] Yes  [ ] No
Has had a continuity problem: [ ] Yes  [ ] No — describe:
Built their own solution:     [ ] Yes  [ ] No — describe:
Interested in a standard:     [ ] Yes  [ ] Maybe  [ ] No

Notes:
```

---

## Target

| Tier | Who | How to reach |
|:---|:---|:---|
| 1 | XR/spatial computing engineers | Discord, GitHub, X |
| 1 | Robotics systems engineers | ROS Discourse, GitHub, conferences |
| 1 | Medical wearable data engineers | HL7 FHIR community, research labs |
| 2 | Zero Trust security architects | LinkedIn, security conferences |
| 2 | Agent framework builders | GitHub discussions, Discord |
| 2 | Industrial IoT integrators | OPC UA forums, trade publications |
| 3 | Individual researchers | arXiv preprints on sensor data, cold email |

**Goal: 20 interviews. Pattern emerges at ~5. Statistical signal at ~15.**

---

## What Success Looks Like

Not "someone agrees to use CPS-0001."

Success is:

> **Three or more unrelated teams, in different domains, describe the same problem — proving that sequential sensor evidence is unbroken across time or system boundaries — and none of them have a common way to express it.**

If you find that pattern, the protocol has a reason to exist.
