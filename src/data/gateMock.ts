import { DEMO_USER_NAMES } from "@/config/assessmentCriteria";
import type {
  GateCondition,
  GateOutcome,
  GateRecommendation,
  JourneyStatus,
  Material,
  MaterialEvent,
} from "@/types/materialPrioritisation";

/**
 * Seeded gate positions across the register. Every gate here was written by a
 * person: nothing is derived from the assessment entries, and nothing advanced
 * itself because its conditions came due.
 */

/** The demo clock. Overdue dates sit behind it, live ones ahead of it. */
const NOW = "2026-08-18";

type Role =
  | "open"
  | "recommended"
  | "go"
  | "go_overturned"
  | "conditions_open"
  | "conditions_partial"
  | "conditions_complete"
  | "conditions_overdue"
  | "hold"
  | "hold_overdue"
  | "no_go"
  | "reopened";

/**
 * 42 slots. 21 untouched, 4 recommended but undecided, 5 go (one of them
 * overturning a Hold recommendation), 5 with conditions, 4 on hold, 2 no-go and
 * one reopened after a no-go.
 */
const ROLES: Role[] = [
  ...Array<Role>(21).fill("open"),
  ...Array<Role>(4).fill("recommended"),
  "go",
  "go",
  "go",
  "go",
  "go_overturned",
  "conditions_open",
  "conditions_open",
  "conditions_partial",
  "conditions_complete",
  "conditions_overdue",
  "hold",
  "hold",
  "hold",
  "hold_overdue",
  "no_go",
  "no_go",
  "reopened",
];

const RECOMMENDATION_TEXT: Record<GateOutcome, string[]> = {
  go: [
    "Two suppliers hold the spec at our volume and the cost gap is under 4%. Nothing left to wait for.",
    "Trial batches held the foam profile and the claim survives a marketing review. Worth committing.",
    "Drop-in on the current line, and the emissions cut carries the 2027 target on its own.",
  ],
  go_with_conditions: [
    "The route works technically, but I want a second source and a stability read before we commit volume.",
    "Cost holds at current volume only. Go, provided procurement locks a 24-month price.",
    "Strong fit, but the claim wording has to clear legal before we put it on a pack.",
  ],
  hold: [
    "Nothing wrong with it — we simply do not know whether the claim sells. That answer is not ours to give.",
    "Only one qualified supplier and all of it out of one region. Hold until that is not true.",
    "Regulatory review lands next spring and would rewrite the whole case. Hold until then.",
  ],
  no_go: [
    "Attempted twice, no supplier interest at our volume, and the cost gap is structural rather than temporary.",
    "The only available grade fails the sensory panel and reformulating the line costs more than it saves.",
  ],
};

const CONDITION_TEXT = [
  "Second supplier qualified outside SE Asia",
  "Marketing completes consumer claim research",
  "Stability data at 40C for 12 weeks",
  "Legal signs off the biodegradability claim",
  "Price locked for 24 months",
  "Pilot line trial at full rate",
  "RSPO MB certificate on file",
  "Sensory panel passes against the current grade",
];

const HOLD_TRIGGERS = [
  "Marketing completes consumer claim research",
  "Second supplier qualified outside SE Asia",
  "ECHA restriction review published",
  "Bio-based grade meets the 12% active spec",
];

const NO_GO_REASONS = [
  "Already attempted twice, no supplier interest at our volume.",
  "Only available grade fails the sensory panel; reformulation costs more than the switch saves.",
  "Cost gap is structural, not a spot price. Revisiting needs a new route, not a new quote.",
];

/** Deterministic PRNG so the seeded gate set is identical between reloads. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const shiftDays = (from: string, days: number) => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface GateSeed {
  materials: Material[];
  events: MaterialEvent[];
}

/**
 * Projects gate state onto the register. Materials that keep an open gate are
 * left exactly as they were — no recommendation, no decision stamp.
 */
export function applyGateSeed(rows: Material[]): GateSeed {
  const r = rng(4711);
  const events: MaterialEvent[] = [];
  let seq = 0;

  const write = (
    m: Material,
    type: MaterialEvent["event_type"],
    field: string,
    from: string | null,
    to: string | null,
    by: string,
    date: string,
    reason: string | null = null,
  ) => {
    events.push({
      event_id: `EVT-GATE-${String(seq++).padStart(4, "0")}`,
      material_id: m.material_id,
      event_type: type,
      field,
      from_value: from,
      to_value: to,
      reason,
      blocker_category: null,
      blocker_detail: null,
      blocker_condition: null,
      changed_by: by,
      changed_at: `${date}T10:${String(10 + (seq % 45)).padStart(2, "0")}:00.000Z`,
      batch_origin: "real_transition",
      batch_id: null,
    });
  };

  /** Roles are spread across the register rather than sitting in one block. */
  const order = rows.map((_, i) => i).sort((a, b) => ((a * 17) % rows.length) - ((b * 17) % rows.length));
  const roleOf = new Map<number, Role>();
  order.forEach((idx, k) => roleOf.set(idx, ROLES[k] ?? "open"));

  const materials = rows.map((row, i) => {
    const role = roleOf.get(i) ?? "open";
    if (role === "open") return row;

    /** Every gated material needs an owner — the gate has to belong to someone. */
    const owner = row.owner ?? DEMO_USER_NAMES[i % DEMO_USER_NAMES.length];
    const m: Material = { ...row, owner, gate_conditions: [] };
    if (row.owner === null) m.provenance = { ...row.provenance, owner: { origin: "entered", source: owner, date: NOW } };

    const recDate = shiftDays(NOW, -(20 + Math.floor(r() * 90)));
    const decDate = shiftDays(recDate, 3 + Math.floor(r() * 12));

    const pickRec = (outcome: GateOutcome): GateRecommendation => {
      const pool = RECOMMENDATION_TEXT[outcome];
      return { outcome, text: pool[Math.floor(r() * pool.length)], author: owner, date: recDate };
    };

    const decide = (status: JourneyStatus) => {
      m.journey_status = status;
      m.gate_decided_by = owner;
      m.gate_decided_date = decDate;
      m.provenance = { ...m.provenance, journey_status: { origin: "entered", source: owner, date: decDate } };
      m.last_status_change_date = decDate;
      m.last_status_user = owner;
      m.last_change_batch_origin = "real_transition";
    };

    const recordRec = (rec: GateRecommendation) => {
      m.recommendation = rec;
      write(m, "recommendation", "recommendation", null, rec.outcome, rec.author, rec.date, rec.text);
    };

    const condition = (text: string, dueOffset: number, met: boolean, k: number): GateCondition => {
      const conditionOwner = DEMO_USER_NAMES[(i + k) % DEMO_USER_NAMES.length];
      const due = shiftDays(NOW, dueOffset);
      return {
        condition_id: `${m.material_id}-C${k + 1}`,
        text,
        owner: conditionOwner,
        due_date: due,
        met,
        met_date: met ? shiftDays(due, -6) : null,
        met_by: met ? conditionOwner : null,
      };
    };

    const addConditions = (specs: [string, number, boolean][]) => {
      m.gate_conditions = specs.map(([text, offset, met], k) => condition(text, offset, met, k));
      m.gate_conditions.forEach((c) => {
        write(m, "condition_change", "gate_condition", null, c.text, owner, decDate, `Due ${c.due_date} · ${c.owner}`);
        if (c.met && c.met_date) write(m, "condition_met", "gate_condition", null, c.text, c.met_by ?? owner, c.met_date);
      });
    };

    const conditionPool = (n: number, start: number) =>
      Array.from({ length: n }, (_, k) => CONDITION_TEXT[(start + k) % CONDITION_TEXT.length]);

    switch (role) {
      case "recommended": {
        // Written, deliberately not decided. The gate stays under evaluation.
        recordRec(pickRec((["go", "go_with_conditions", "hold", "no_go"] as GateOutcome[])[i % 4]));
        break;
      }
      case "go": {
        recordRec(pickRec("go"));
        decide("go");
        write(m, "gate_outcome", "journey_status", row.journey_status, "go", owner, decDate);
        break;
      }
      case "go_overturned": {
        // Recommendation said Hold, the decision was Go. Both stay visible.
        recordRec(pickRec("hold"));
        decide("go");
        write(m, "gate_outcome", "journey_status", row.journey_status, "go", owner, decDate);
        break;
      }
      case "conditions_open":
      case "conditions_partial":
      case "conditions_complete":
      case "conditions_overdue": {
        recordRec(pickRec("go_with_conditions"));
        decide("go_with_conditions");
        write(m, "gate_outcome", "journey_status", row.journey_status, "go_with_conditions", owner, decDate);
        const [a, b, c] = conditionPool(3, i);
        if (role === "conditions_open") addConditions([[a, 34, false], [b, 61, false]]);
        if (role === "conditions_partial") addConditions([[a, -12, true], [b, 27, false], [c, 55, false]]);
        if (role === "conditions_complete")
          addConditions([[a, -30, true], [b, -14, true], [c, 12, true]]);
        if (role === "conditions_overdue") addConditions([[a, -21, false], [b, 40, false]]);
        break;
      }
      case "hold":
      case "hold_overdue": {
        recordRec(pickRec("hold"));
        decide("hold");
        write(m, "gate_outcome", "journey_status", row.journey_status, "hold", owner, decDate);
        m.hold_trigger_event = HOLD_TRIGGERS[i % HOLD_TRIGGERS.length];
        m.hold_review_date = role === "hold_overdue" ? shiftDays(NOW, -26) : shiftDays(NOW, 45 + (i % 60));
        write(m, "hold_change", "hold_trigger_event", null, m.hold_trigger_event, owner, decDate);
        write(m, "hold_change", "hold_review_date", null, m.hold_review_date, owner, decDate);
        break;
      }
      case "no_go": {
        recordRec(pickRec("no_go"));
        decide("no_go");
        write(m, "gate_outcome", "journey_status", row.journey_status, "no_go", owner, decDate);
        m.no_go_reason = NO_GO_REASONS[i % NO_GO_REASONS.length];
        write(m, "no_go_reason", "no_go_reason", null, m.no_go_reason, owner, decDate);
        break;
      }
      case "reopened": {
        // No-go, then reopened. The old reason is kept, never deleted.
        const previousReason = NO_GO_REASONS[0];
        const noGoDate = shiftDays(recDate, 2);
        recordRec(pickRec("no_go"));
        write(m, "gate_outcome", "journey_status", row.journey_status, "no_go", owner, noGoDate);
        write(m, "no_go_reason", "no_go_reason", null, previousReason, owner, noGoDate);
        m.previous_no_go = { reason: previousReason, author: owner, date: noGoDate };
        m.no_go_reason = null;
        m.reopened = true;
        decide("under_evaluation");
        write(m, "reopen", "reopen", "no_go", "under_evaluation", owner, decDate, "New route surfaced in the VCG signals.");
        break;
      }
      default:
        break;
    }

    return m;
  });

  return { materials, events };
}
