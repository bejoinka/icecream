# City Profiling Brief

**Purpose** This brief provides standardized instructions for profiling real U.S. cities and neighborhoods so they can be translated into starting values for the game’s city system. It is designed to be used alongside the *Game Fact Sheet* and *City System Spec*.

Agents should treat this as a **calibration and justification exercise**, not a simulation or prediction task.

---

## What You Are Producing

For each assigned city, produce:

1. **City Overview** (1–2 paragraphs)
2. **City Pulse Values** (numeric, with justification)
3. **Neighborhood Set** (3–6 neighborhoods)
4. **Neighborhood Pulse Snapshots** (initial values)
5. **Short Rationale** explaining why this city will be interesting to play

Avoid tactical detail. Focus on systems, posture, and tone.

---

## Sources You May Use (Non‑Exhaustive)

You may rely on:

- Public sanctuary / cooperation policies
- Mayor, city council, and police department public statements
- Known participation in federal programs (e.g. data sharing, task forces)
- Density and maturity of transit, DMV, school, and municipal IT systems
- Presence of NGOs, mutual aid groups, legal clinics
- Media market size and framing tendencies
- Recent political or legal conflicts related to immigration

Do **not** use:

- Private addresses or personal data
- Step‑by‑step real‑world guidance

---

## Step 1: City Overview

Write a short, neutral description covering:

- City size and role (port city, tech hub, border region, etc.)
- Public political identity vs lived reality
- General relationship to federal enforcement

This sets tone, not mechanics.

---

## Step 2: City Pulse Assignment

Assign initial values for the following variables (0–100):

```ts
CityPulse {
  federalCooperation
  dataDensity
  politicalCover
  civilSocietyCapacity
  bureaucraticInertia
}
```

### Scoring Guidance

**federalCooperation**

- Low: explicit resistance, legal challenges, refusal to cooperate
- Medium: symbolic sanctuary, quiet compliance
- High: joint task forces, routine cooperation

**dataDensity**

- Low: fragmented, paper‑heavy systems
- Medium: partially modernized
- High: integrated digital systems across agencies

**politicalCover**

- Low: leadership avoids confrontation, prioritizes optics
- High: leadership willing to absorb legal/media backlash

**civilSocietyCapacity**

- Low: few NGOs, limited legal aid
- Medium: present but stretched
- High: dense networks of support and advocacy

**bureaucraticInertia**

- Low: efficient, fast‑moving administration
- High: slow, inconsistent, internally fragmented

Each value must include **1–2 sentences of justification**.

---

## Step 3: Neighborhood Selection

Select **3–6 neighborhoods** that together represent:

- Different demographic compositions
- Different enforcement exposure levels
- Different trust/suspicion dynamics

Neighborhoods may be real or lightly abstracted versions of real areas.

For each neighborhood, provide:

- Name
- One‑sentence characterization

---

## Step 4: Neighborhood Pulse Snapshots

For each neighborhood, assign initial values:

```ts
NeighborhoodPulse {
  trust
  suspicion
  enforcementVisibility
  communityDensity
  economicPrecarity
}
```

### Interpretation Reminders

- Trust and suspicion can both be high
- Enforcement visibility is about *presence*, not severity
- Community density reflects social connectedness, not population count

Provide a brief rationale per neighborhood (2–3 sentences).

---

## Step 5: Playability Rationale

Answer briefly:

- What kinds of stories does this city enable?
- Where does pressure tend to surface first?
- What makes this city distinct from others in the roster?

This helps designers ensure diversity of experiences.

---

## Tone & Constraints

- Write neutrally and analytically
- Avoid moralizing language
- Avoid operational detail
- Assume the reader is a systems designer, not a player

---

## Output Format (Preferred)

- Markdown or structured JSON/YAML
- Clear headings
- Numeric values always paired with justification

---

## Success Criteria

A successful city profile:

- Can be dropped into the system without further interpretation
- Feels plausible and internally consistent
- Produces meaningful tension without relying on extremes
- Reflects systemic dynamics rather than anecdotes

---

## Final Note

You are not predicting the future. You are encoding **how a city tends to behave under pressure** so the game can explore the human consequences of that behavior.

