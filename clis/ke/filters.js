import { ArgumentError } from '@jackwener/opencli/errors';

// keyword → Beike URL code. Values confirmed against the live site (Task 1).
export const ORIENTATION = {
  'south-north': 'f5', south: 'f2', east: 'f1', north: 'f4', west: 'f3',
};
export const FLOOR = { low: 'lc1', mid: 'lc2', high: 'lc3' };
export const AGE = { '5': 'y1', '10': 'y2', '15': 'y3', '20': 'y4', '20+': 'y5' };
export const DECORATION = { fine: 'de1', simple: 'de2', rough: 'de3' };
export const ELEVATOR = { yes: 'ie1', no: 'ie2' };
// 房源特色 (multi-select). Iteration order here IS the emit order.
export const FEATURES = {
  'must-see': 'ng1',
  'five-years': 'mw1',
  'two-years': 'mw2',
  'near-subway': 'nb1',
  vr: 'vr1',
  'new-7d': 'nd1',
  'anytime-view': 'av1',
};
export const USAGE = {
  residential: 'sf1', commercial: 'sf2', villa: 'sf3',
  courtyard: 'sf4', parking: 'sf5', other: 'sf6',
};
export const SORT = {
  newest: 'co32',
  'total-price-asc': 'co21',
  'total-price-desc': 'co22',
  'unit-price-asc': 'co41',
  'unit-price-desc': 'co42',
  'area-asc': 'co51',
  'area-desc': 'co52',
};

function lookup(table, key) {
  if (key === undefined || key === null || key === '') return '';
  return table[String(key)] || '';
}

function roomsCode(rooms) {
  return rooms ? `l${rooms}` : '';
}

function priceCode(kwargs) {
  const min = kwargs['min-price'];
  const max = kwargs['max-price'];
  if (!min && !max) return '';
  return `p${min || ''}t${max || ''}`;
}

function areaCode(kwargs) {
  const min = kwargs['min-area'];
  const max = kwargs['max-area'];
  if (!min && !max) return '';
  return `ba${min || ''}ea${max || ''}`;
}

function featuresCode(raw) {
  if (!raw) return '';
  const requested = new Set(
    String(raw).split(',').map((s) => s.trim()).filter(Boolean),
  );
  for (const key of requested) {
    if (!FEATURES[key]) {
      throw new ArgumentError(
        `unknown --features value: "${key}"`,
        `Allowed: ${Object.keys(FEATURES).join(', ')}`,
      );
    }
  }
  // emit in table-definition order, not user order
  return Object.keys(FEATURES).filter((k) => requested.has(k)).map((k) => FEATURES[k]).join('');
}

// Canonical left-to-right order Beike concatenates prefixes in (confirmed in Task 1).
const SEGMENT_PRODUCERS = [
  (k) => lookup(SORT, k.sort),
  (k) => featuresCode(k.features),
  (k) => lookup(ORIENTATION, k.orientation),
  (k) => lookup(FLOOR, k.floor),
  (k) => lookup(AGE, k.age),
  (k) => lookup(DECORATION, k.decoration),
  (k) => lookup(ELEVATOR, k.elevator),
  (k) => lookup(USAGE, k.usage),
  (k) => roomsCode(k.rooms),
  (k) => priceCode(k),
  (k) => areaCode(k),
];

/**
 * Build the Beike filter/sort code segment for /ershoufang/{district}/{segment}/.
 * Returns '' when no filters/sort are active.
 */
export function buildErshoufangFilterPath(kwargs) {
  const parts = [];
  for (const produce of SEGMENT_PRODUCERS) {
    const code = produce(kwargs);
    if (code) parts.push(code);
  }
  return parts.join('');
}
