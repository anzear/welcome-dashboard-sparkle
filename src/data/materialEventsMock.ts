import type { JourneyStatus, Material, MaterialEvent } from "@/types/materialPrioritisation";
import { materials as seedMaterials } from "@/data/materialPrioritisationMock";

/** The date their file was loaded. Everything stamped here is baselining, not team activity. */
export const LOAD_DATE = "2025-11-20T08:00:00.000Z";

const USERS = ["L. Haugen", "S. Rautio", "K. Brandt", "R. Delacroix", "M. Oyelaran"];

const BLOCKERS: { category: string; detail: string; condition: string }[] = [
  {
    category: "Technical performance",
    detail: "Bio-based grade fails the low-temperature flexibility spec in the current formulation.",
    condition: "A grade meeting -20 C flexibility at equal loading is qualified.",
  },
  {
    category: "Regulatory / compliance",
    detail: "Substance sits under REACH authorisation review; re-sourcing is not accepted as a remedy.",
    condition: "An approved-use derogation is granted, or the application is reformulated out.",
  },
  {
    category: "Supply availability",
    detail: "Single certified supplier, no second source at the volumes we run.",
    condition: "A second supplier qualifies at 500 t/yr with ISCC PLUS certification.",
  },
  {
    category: "Cost gap",
    detail: "Renewable grade lands 34% above the incumbent at current contract volumes.",
    condition: "The delta closes below 10%, or the premium is accepted in the product price.",
  },
  {
    category: "Customer approval",
    detail: "Two key accounts have not re-approved the changed specification.",
    condition: "Both accounts sign off the revised spec sheet.",
  },
];

/** Deterministic PRNG so the seeded history is stable between renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EARLY_STATUSES: JourneyStatus[] = ["under_evaluation", "hold"];

const REASONS = [
  "Screening call with the incumbent supplier closed out.",
  "Lab trial results reviewed with the formulation team.",
  "Moved after the Q1 category review.",
  "Volume forecast revised, priority re-cut.",
  "Handover following the procurement reorganisation.",
  null,
  null,
];

const CORRECTIONS: { field: string; from: string; to: string }[] = [
  { field: "material_class", from: "Phthalate ester", to: "Adipate ester" },
  { field: "material_class", from: "Non-ionic surfactant", to: "Alkyl polyglucoside" },
  { field: "cas_number", from: "0000-00-0", to: "corrected from supplier SDS" },
];

const iso = (ms: number) => new Date(ms).toISOString();

const LOAD_MS = Date.parse(LOAD_DATE);
const NOW_MS = Date.parse("2026-08-05T12:00:00.000Z");

function buildEvents(materials: Material[]): MaterialEvent[] {
  const events: MaterialEvent[] = [];
  let n = 0;
  const id = () => `EVT-${String(++n).padStart(5, "0")}`;

  // Two bulk batches, so bulk changes appear in the record.
  const batchA = { batch_id: "BATCH-2026-03-11-A", at: "2026-03-11T14:20:00.000Z", by: "K. Brandt" };
  const batchB = { batch_id: "BATCH-2026-06-02-B", at: "2026-06-02T09:05:00.000Z", by: "S. Rautio" };

  materials.forEach((m, i) => {
    const rnd = mulberry32(i * 7919 + 13);
    const baseStatus = EARLY_STATUSES[i % EARLY_STATUSES.length];

    // 1 — baselining event, same load date for every material.
    events.push({
      event_id: id(),
      material_id: m.material_id,
      event_type: "status_change",
      field: "journey_status",
      from_value: null,
      to_value: baseStatus,
      reason: null,
      blocker_category: null,
      blocker_detail: null,
      blocker_condition: null,
      changed_by: "System import",
      changed_at: LOAD_DATE,
      batch_origin: "baselining",
      batch_id: null,
    });

    if (m.owner) {
      events.push({
        event_id: id(),
        material_id: m.material_id,
        event_type: "owner_change",
        field: "owner",
        from_value: null,
        to_value: m.owner,
        reason: null,
        blocker_category: null,
        blocker_detail: null,
        blocker_condition: null,
        changed_by: "System import",
        changed_at: LOAD_DATE,
        batch_origin: "baselining",
        batch_id: null,
      });
    }

    // ~60% carry real transitions since.
    if (i % 5 === 3 || i % 7 === 5) return;

    const count = 1 + Math.floor(rnd() * 6);
    const span = NOW_MS - LOAD_MS - 86400000 * 20;
    const times: number[] = [];
    for (let k = 0; k < count; k++) times.push(LOAD_MS + 86400000 * 12 + Math.floor(rnd() * span));
    times.sort((a, b) => a - b);

    let currentStatus: JourneyStatus = baseStatus;
    let currentOwner = m.owner;
    let priority = false;

    times.forEach((t, k) => {
      const last = k === times.length - 1;
      const user = USERS[Math.floor(rnd() * USERS.length)];
      const reason = REASONS[Math.floor(rnd() * REASONS.length)];
      const roll = rnd();

      if (last) {
        // Land on the material's recorded position.
        if (currentStatus !== m.journey_status) {
          events.push({
            event_id: id(),
            material_id: m.material_id,
            event_type: "status_change",
            field: "journey_status",
            from_value: currentStatus,
            to_value: m.journey_status,
            reason,
            blocker_category: null,
            blocker_detail: null,
            blocker_condition: null,
            changed_by: user,
            changed_at: iso(t),
            batch_origin: "real_transition",
            batch_id: null,
          });
          currentStatus = m.journey_status;
        }
        if (m.journey_status === "hold" || m.journey_status === "no_go") {
          const b = BLOCKERS[i % BLOCKERS.length];
          events.push({
            event_id: id(),
            material_id: m.material_id,
            event_type: "blocker_set",
            field: "blocker_category",
            from_value: null,
            to_value: b.category,
            reason: null,
            blocker_category: b.category,
            blocker_detail: b.detail,
            blocker_condition: b.condition,
            changed_by: user,
            changed_at: iso(t + 60000),
            batch_origin: "real_transition",
            batch_id: null,
          });
        }
        if (currentOwner !== (m.owner ?? null)) {
          events.push({
            event_id: id(),
            material_id: m.material_id,
            event_type: "owner_change",
            field: "owner",
            from_value: currentOwner,
            to_value: m.owner,
            reason: null,
            blocker_category: null,
            blocker_detail: null,
            blocker_condition: null,
            changed_by: user,
            changed_at: iso(t + 90000),
            batch_origin: "real_transition",
            batch_id: null,
          });
          currentOwner = m.owner;
        }
        if (m.priority_period !== null && !priority) {
          events.push({
            event_id: id(),
            material_id: m.material_id,
            event_type: "priority_change",
            field: "priority_period",
            from_value: null,
            to_value: m.priority_period,
            reason: null,
            blocker_category: null,
            blocker_detail: null,
            blocker_condition: null,
            changed_by: user,
            changed_at: iso(t + 120000),
            batch_origin: "real_transition",
            batch_id: null,
          });
          priority = true;
        }
        return;
      }

      if (roll < 0.55) {
        const next = EARLY_STATUSES[Math.floor(rnd() * EARLY_STATUSES.length)];
        if (next === currentStatus) return;
        const bulk = i % 6 === 0 ? batchA : i % 11 === 4 ? batchB : null;
        events.push({
          event_id: id(),
          material_id: m.material_id,
          event_type: "status_change",
          field: "journey_status",
          from_value: currentStatus,
          to_value: next,
          reason: bulk ? "Category review sweep." : reason,
          blocker_category: null,
          blocker_detail: null,
          blocker_condition: null,
          changed_by: bulk ? bulk.by : user,
          changed_at: bulk ? bulk.at : iso(t),
          batch_origin: "real_transition",
          batch_id: bulk ? bulk.batch_id : null,
        });
        currentStatus = next;
      } else if (roll < 0.78) {
        const next = USERS[Math.floor(rnd() * USERS.length)];
        if (next === currentOwner) return;
        events.push({
          event_id: id(),
          material_id: m.material_id,
          event_type: "owner_change",
          field: "owner",
          from_value: currentOwner,
          to_value: next,
          reason,
          blocker_category: null,
          blocker_detail: null,
          blocker_condition: null,
          changed_by: user,
          changed_at: iso(t),
          batch_origin: "real_transition",
          batch_id: null,
        });
        currentOwner = next;
      } else if (roll < 0.9) {
        priority = !priority;
        events.push({
          event_id: id(),
          material_id: m.material_id,
          event_type: "priority_change",
          field: "priority_period",
          from_value: priority ? null : (m.priority_period ?? "H2 2026"),
          to_value: priority ? (m.priority_period ?? "H2 2026") : null,
          reason,
          blocker_category: null,
          blocker_detail: null,
          blocker_condition: null,
          changed_by: user,
          changed_at: iso(t),
          batch_origin: "real_transition",
          batch_id: null,
        });
      } else {
        const c = CORRECTIONS[i % CORRECTIONS.length];
        events.push({
          event_id: id(),
          material_id: m.material_id,
          event_type: "field_correction",
          field: c.field,
          from_value: c.field === "cas_number" ? c.from : c.from,
          to_value: c.field === "cas_number" ? (m.cas_number ?? c.to) : (m.material_class ?? c.to),
          reason: "Classification queried by the category owner.",
          blocker_category: null,
          blocker_detail: null,
          blocker_condition: null,
          changed_by: user,
          changed_at: iso(t),
          batch_origin: "real_transition",
          batch_id: null,
        });
      }
    });
  });

  return events;
}

export const seedEvents: MaterialEvent[] = buildEvents(seedMaterials);

/** Last-change stamps always follow the log, never the other way round. */
export function stampLastChange(materials: Material[], events: MaterialEvent[]): Material[] {
  const latest = new Map<string, MaterialEvent>();
  events.forEach((e) => {
    const cur = latest.get(e.material_id);
    if (!cur || e.changed_at >= cur.changed_at) latest.set(e.material_id, e);
  });
  return materials.map((m) => {
    const e = latest.get(m.material_id);
    if (!e) {
      return { ...m, last_status_change_date: null, last_status_user: null, last_change_batch_origin: null };
    }
    return {
      ...m,
      last_status_change_date: e.changed_at,
      last_status_user: e.changed_by,
      last_change_batch_origin: e.batch_origin,
    };
  });
}

export const seedMaterialsWithHistory: Material[] = stampLastChange(seedMaterials, seedEvents);
