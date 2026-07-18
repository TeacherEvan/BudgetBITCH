// lib/utils/date.ts
//
// Thai locale + public holiday helpers.
// Holiday dates sourced from timeanddate.com (Thailand) for 2026 / 2027.
// Buddhist holidays (Makha Bucha, Visakha Bucha, Asalha Bucha) shift with the
// lunar calendar, so they are stored as explicit dates rather than computed.

export interface ThaiHoliday {
  /** ISO date string: 'YYYY-MM-DD' */
  date: string;
  /** English name */
  name: string;
  /** Thai name */
  nameTh: string;
  /** Whether this is an official non-working national holiday */
  national: boolean;
}

// Buddhist Era offset: Gregorian year + 543.
export const BUDDHIST_ERA_OFFSET = 543;

/**
 * Buddhist holidays move with the lunar calendar year to year; these are the
 * confirmed Gregorian dates for 2026 and 2027.
 */
const HOLIDAYS_2026: ThaiHoliday[] = [
  { date: '2026-01-01', name: "New Year's Day", nameTh: 'วันขึ้นปีใหม่', national: true },
  { date: '2026-01-02', name: 'New Year Special Holiday', nameTh: 'วันหยุดพิเศษปีใหม่', national: true },
  { date: '2026-03-03', name: 'Makha Bucha', nameTh: 'วันมาฆบูชา', national: true },
  { date: '2026-04-06', name: 'Chakri Day', nameTh: 'วันจักรี', national: true },
  { date: '2026-04-13', name: 'Songkran', nameTh: 'วันสงกรานต์', national: true },
  { date: '2026-04-14', name: 'Songkran Holiday', nameTh: 'วันหยุดสงกรานต์', national: true },
  { date: '2026-04-15', name: 'Songkran Holiday', nameTh: 'วันหยุดสงกรานต์', national: true },
  { date: '2026-05-01', name: 'Labor Day', nameTh: 'วันแรงงานแห่งชาติ', national: true },
  { date: '2026-05-04', name: 'Coronation Day', nameTh: 'วันฉัตรมงคล', national: true },
  { date: '2026-05-31', name: 'Visakha Bucha', nameTh: 'วันวิสาขบูชา', national: true },
  { date: '2026-06-01', name: 'Day off for Visakha Bucha', nameTh: 'วันหยุดชดเชยวิสาขบูชา', national: true },
  { date: '2026-06-03', name: "Queen Suthida's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', national: true },
  { date: '2026-07-28', name: "King Vajiralongkorn's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษา ร.10', national: true },
  { date: '2026-07-29', name: 'Asalha Bucha', nameTh: 'วันอาสาฬหบูชา', national: true },
  { date: '2026-08-12', name: "The Queen Mother's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินีนาถ', national: true },
  { date: '2026-10-13', name: 'Anniversary of the Death of King Bhumibol', nameTh: 'วันคล้ายวันสวรรคต ร.9', national: true },
  { date: '2026-10-23', name: 'Chulalongkorn Day', nameTh: 'วันปิยมหาราช', national: true },
  { date: '2026-12-05', name: "King Bhumibol's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษา ร.9 / วันพ่อแห่งชาติ', national: true },
  { date: '2026-12-07', name: "King Bhumibol's Birthday observed", nameTh: 'วันหยุดชดเชยวันพ่อแห่งชาติ', national: true },
  { date: '2026-12-10', name: 'Constitution Day', nameTh: 'วันรัฐธรรมนูญ', national: true },
  { date: '2026-12-31', name: "New Year's Eve", nameTh: 'วันสิ้นปี', national: true },
];

const HOLIDAYS_2027: ThaiHoliday[] = [
  { date: '2027-01-01', name: "New Year's Day", nameTh: 'วันขึ้นปีใหม่', national: true },
  { date: '2027-02-21', name: 'Makha Bucha', nameTh: 'วันมาฆบูชา', national: true },
  { date: '2027-04-06', name: 'Chakri Day', nameTh: 'วันจักรี', national: true },
  { date: '2027-04-13', name: 'Songkran', nameTh: 'วันสงกรานต์', national: true },
  { date: '2027-04-14', name: 'Songkran Holiday', nameTh: 'วันหยุดสงกรานต์', national: true },
  { date: '2027-04-15', name: 'Songkran Holiday', nameTh: 'วันหยุดสงกรานต์', national: true },
  { date: '2027-05-01', name: 'Labor Day', nameTh: 'วันแรงงานแห่งชาติ', national: true },
  { date: '2027-05-03', name: 'Labor Day observed', nameTh: 'วันหยุดชดเชยวันแรงงาน', national: true },
  { date: '2027-05-04', name: 'Coronation Day', nameTh: 'วันฉัตรมงคล', national: true },
  { date: '2027-05-20', name: 'Visakha Bucha', nameTh: 'วันวิสาขบูชา', national: true },
  { date: '2027-06-03', name: "Queen Suthida's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', national: true },
  { date: '2027-07-19', name: 'Asalha Bucha', nameTh: 'วันอาสาฬหบูชา', national: true },
  { date: '2027-07-20', name: 'Khao Phansa', nameTh: 'วันเข้าพรรษา', national: true },
  { date: '2027-07-28', name: "King Vajiralongkorn's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษา ร.10', national: true },
  { date: '2027-08-12', name: "The Queen Mother's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินีนาถ', national: true },
  { date: '2027-10-13', name: 'Anniversary of the Death of King Bhumibol', nameTh: 'วันคล้ายวันสวรรคต ร.9', national: true },
  { date: '2027-10-23', name: 'Chulalongkorn Day', nameTh: 'วันปิยมหาราช', national: true },
  { date: '2027-10-25', name: 'Day off for Chulalongkorn Day', nameTh: 'วันหยุดชดเชยวันปิยมหาราช', national: true },
  { date: '2027-12-05', name: "King Bhumibol's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษา ร.9 / วันพ่อแห่งชาติ', national: true },
  { date: '2027-12-06', name: "King Bhumibol's Birthday observed", nameTh: 'วันหยุดชดเชยวันพ่อแห่งชาติ', national: true },
  { date: '2027-12-10', name: 'Constitution Day', nameTh: 'วันรัฐธรรมนูญ', national: true },
  { date: '2027-12-31', name: "New Year's Eve", nameTh: 'วันสิ้นปี', national: true },
];

const HOLIDAYS_BY_YEAR: Record<number, ThaiHoliday[]> = {
  2026: HOLIDAYS_2026,
  2027: HOLIDAYS_2027,
};

/**
 * Returns the array of Thai public/Buddhist holidays for a given Gregorian year.
 * Returns an empty array for years without a curated table (add more years to
 * HOLIDAYS_BY_YEAR as needed).
 */
export function getThaiHolidays(year: number): ThaiHoliday[] {
  return HOLIDAYS_BY_YEAR[year] ?? [];
}

/**
 * Formats a Gregorian date's year into the Buddhist Era (ปี พ.ศ.).
 * e.g. 2026 -> 2569.
 */
export function getThaiBuddhistEraYear(date: Date): number {
  return date.getFullYear() + BUDDHIST_ERA_OFFSET;
}

/**
 * Formats a date as a Buddhist Era year string, e.g. "2569".
 */
export function formatBuddhistEra(date: Date): string {
  return String(getThaiBuddhistEraYear(date));
}

/** Returns an ISO 'YYYY-MM-DD' key for a Date in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks whether a given date is a Thai holiday.
 * By default only national (non-working) holidays count; pass
 * { includeObservances: true } to match all listed holidays.
 */
export function isHoliday(date: Date, opts?: { includeObservances?: boolean }): boolean {
  const year = date.getFullYear();
  const holidays = getThaiHolidays(year);
  const iso = toISODate(date);
  return holidays.some(
    (h) => h.date === iso && (opts?.includeObservances || h.national),
  );
}

/**
 * Returns the holiday(s) falling on a given date, or [] if none.
 */
export function getHolidaysOn(date: Date): ThaiHoliday[] {
  const year = date.getFullYear();
  const iso = toISODate(date);
  return getThaiHolidays(year).filter((h) => h.date === iso);
}
