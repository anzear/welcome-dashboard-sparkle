// Demo seed for the user group "test".
//
// Purpose: show two groups side by side (the permanent system group
// "Annex IX Part A" and an ordinary user group) and demonstrate filtering by
// one or several groups.
//
// Membership is a STORED list of pathway ids — unlike 9A, there is no rule.
// The selection below is deterministic (never random) and is built so that all
// four buckets exist: 9A only, test only, both, neither. It also produces
// collapsed rows where only SOME child pathways are members (outlined chip)
// and rows where EVERY child is a member (filled chip).

import { annexIxInfo } from '@/data/annexIx';

export const TEST_GROUP_ID = 'grp-test';

/** Feedstocks that never qualify for Annex IX Part A — used for "test only". */
const NON_QUALIFYING = [
  'Corn Starch',
  'Sugarcane Molasses',
  'Whey Permeate',
  'Glucose Syrup',
  'Potato Starch',
];

interface Triple {
  feedstock: string;
  technology: string;
  product: string;
}

/**
 * Deterministic membership for the demo group. Collapsed rows in the Full view
 * group by feedstock + process + material, so subsets are picked inside a
 * triple to make the partial-membership chip visible.
 */
export function testGroupMemberIds(pathways: Triple[]): number[] {
  const triples = new Map<string, number[]>();
  pathways.forEach((p, i) => {
    const key = `${p.feedstock}||${p.technology}||${p.product}`;
    const list = triples.get(key);
    if (list) list.push(i);
    else triples.set(key, [i]);
  });

  const keys = [...triples.keys()].sort();
  const feedstockOf = (key: string) => key.split('||')[0];
  const annexKeys = keys.filter((k) => annexIxInfo(feedstockOf(k)).annexIxPartA);
  const plainKeys = keys.filter((k) => NON_QUALIFYING.includes(feedstockOf(k)));

  const out = new Set<number>();

  // Four collapsed rows on qualifying feedstocks with only some children in the
  // group → filled "9A" next to an outlined "test n/m".
  const partialAnnex = annexKeys.filter((k) => (triples.get(k)?.length ?? 0) >= 3).slice(0, 4);
  partialAnnex.forEach((k) => {
    const ids = triples.get(k)!;
    ids.slice(0, Math.max(1, Math.floor(ids.length / 2))).forEach((id) => out.add(id));
  });

  // Two collapsed rows where every child is a member → filled "test".
  const fullAnnex = annexKeys
    .filter((k) => !partialAnnex.includes(k) && (triples.get(k)?.length ?? 0) >= 2)
    .slice(0, 2);
  fullAnnex.forEach((k) => triples.get(k)!.forEach((id) => out.add(id)));

  // "test only" — non-qualifying feedstocks, mixed full and partial triples,
  // until the bucket is comfortably above five and the total lands around 35.
  let plainCount = 0;
  for (const k of plainKeys) {
    if (plainCount >= 14) break;
    const ids = triples.get(k)!;
    const take = ids.length >= 3 ? ids.slice(0, Math.max(1, Math.floor(ids.length / 2))) : ids;
    take.forEach((id) => out.add(id));
    plainCount += take.length;
  }

  return [...out].sort((a, b) => a - b);
}
