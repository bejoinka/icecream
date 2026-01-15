# City System Spec

**Purpose** Define a scalable, data-driven model for U.S. cities and neighborhoods that translates national conditions into lived, local consequences. This spec is intended to be fed to agents that infer starting values for real U.S. cities and neighborhoods. Harbor City is included only as a worked example.

---

## Scope & Non-Goals

- **In scope:** Global/National pulse, City pulse, Neighborhood pulse, Events, ranges, update cadence, propagation rules.
- **Out of scope:** Family member attributes and tactics (family impact is represented only via four interface variables).

---

## Layered World Model (Authoritative)

```
Global / National
        ↓
      City
        ↓
  Neighborhood
        ↓
     Family (interface only)
```

Rules:

- Pulses drift; events shock.
- Effects propagate **down easily**, **up slowly**.
- Players experience consequences before causes.

---

## 1) Global / National Layer

### Purpose

Sets the political and media weather. Not directly controllable by the player.

### Update Cadence

- **Pulse:** every 7–14 in‑game days
- **Events:** rare, high‑impact

### Types & Ranges

```ts
GlobalPulse {
  enforcementClimate: number;      // 0–100
  mediaNarrative: number;           // -100–+100
  judicialAlignment: number;        // -50–+50
  politicalVolatility: number;      // 0–100
}
```

**Interpretation Bands**

- *enforcementClimate*: 0–20 lax · 21–50 baseline · 51–80 aggressive · 81–100 crisis
- *mediaNarrative*: -100 fatigue/sympathy · 0 neutral · +100 panic/scapegoating
- *judicialAlignment*: -50 rights‑expansive · 0 mixed · +50 executive‑deferential
- *politicalVolatility*: higher = sharper swings, more randomness

### Global Events

```ts
GlobalEvent {
  type: 'Executive' | 'Judicial' | 'Media' | 'Security';
  magnitude: 1 | 2 | 3 | 4 | 5;
  durationDays: number;
}
```

Effects scale with magnitude and decay over duration.

---

## 2) City Layer

### Purpose

Interprets national pressure into local policy, bureaucracy, and tone.

### Update Cadence

- **Pulse:** every 3–7 days
- **Events:** every 1–3 weeks

### Types & Ranges

```ts
CityPulse {
  federalCooperation: number;   // 0–100
  dataDensity: number;          // 0–100
  politicalCover: number;       // 0–100
  civilSocietyCapacity: number; // 0–100
  bureaucraticInertia: number;  // 0–100
}
```

**Interpretation Bands**

- *federalCooperation*: 0–20 resist · 21–50 passive · 51–80 quiet comply · 81–100 partner
- *dataDensity*: low = siloed · high = integrated (faster surprise propagation)
- *politicalCover*: low = abandon quickly · high = absorb backlash
- *civilSocietyCapacity*: low = thin safety net · high = rescue windows
- *bureaucraticInertia*: high = delays, incompetence, absurd outcomes (cuts both ways)

### City Events

```ts
CityEvent {
  category: 'Policy' | 'Budget' | 'Infrastructure' | 'Media';
  visibility: number; // 0–100 (player comprehension)
  impactRadius: 'All' | NeighborhoodID[];
}
```

City events re‑weight neighborhoods; they do not target families directly.

---

## 3) Neighborhood Layer

### Purpose

Primary playable surface where daily life and tension occur.

### Update Cadence

- **Pulse:** daily
- **Events:** frequent, small‑scale

### Types & Ranges

```ts
NeighborhoodPulse {
  trust: number;                // 0–100
  suspicion: number;            // 0–100
  enforcementVisibility: number;// 0–100
  communityDensity: number;     // 0–100
  economicPrecarity: number;    // 0–100
}
```

**Notes**

- *trust* and *suspicion* are not inverses; both may be high.

### Neighborhood Events

```ts
NeighborhoodEvent {
  type: 'Audit' | 'Checkpoint' | 'RaidRumor' | 'Meeting' | 'Detention';
  severity: 1 | 2 | 3 | 4 | 5;
  target: 'Family' | 'Employer' | 'School' | 'Block';
}
```

Severity controls scope, duration, and cross‑system spillover.

---

## 4) Family Interface (Impact Only)

The family influences neighborhoods indirectly via four variables. No individual stats are defined here.

```ts
FamilyImpact {
  visibility: number;            // 0–100
  stress: number;                // 0–100
  cohesion: number;              // 0–100
  trustNetworkStrength: number;  // 0–100
}
```

Rules:

- Family variables **nudge** neighborhood pulses.
- They do not directly alter city or national pulses.

---

## 5) Cross‑Layer Propagation (Reference)

Illustrative (non‑binding) math:

```ts
neighborhood.enforcementVisibility +=
  (city.federalCooperation * 0.2) +
  (global.enforcementClimate * 0.1);

neighborhood.trust += family.trustNetworkStrength * 0.15;
neighborhood.suspicion += family.visibility * 0.1;
```

Upward propagation is rare, slow, and narrative‑driven.

---

## 6) Player Perception (Opacity by Design)

| Layer        | Visibility | Surface Signals        |
| ------------ | ---------- | ---------------------- |
| Global       | Low        | News, rhetoric, vibes  |
| City         | Partial    | Press releases, rumors |
| Neighborhood | High       | Direct events          |
| Family       | Full       | UI meters              |

---

## 7) Worked Example (Harbor City — Optional)

Use only as calibration guidance for agents.

```ts
CityPulse = {
  federalCooperation: 55,
  dataDensity: 80,
  politicalCover: 35,
  civilSocietyCapacity: 60,
  bureaucraticInertia: 70,
}
```

Neighborhood archetypes (example):

- Dense immigrant enclave: high trust, high visibility, high density
- Mixed suburb: low visibility, fragile trust
- Gentrifying core: high visibility, media amplification

---

## 8) Agent Instructions (For Real U.S. Cities)

Agents should infer starting values using:

- Public sanctuary/cooperation policies
- Data integration maturity (DMV, transit, schools)
- NGO/legal density
- Media market dynamics
- Recent political behavior

Values should be justified with a short rationale per variable.

---

## Summary

This spec defines a bounded, implementable system where national pressure collapses into neighborhood‑level risk through city‑specific translation, while family impact remains indirect and legible.

