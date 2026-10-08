/*
 * Opening hours of the yard in Zele and the one-line status the header
 * shows ("Nu open tot 18:00"). Times are evaluated in Europe/Brussels,
 * whatever the visitor's own time zone. Public holidays are not modelled.
 */

/** Opening hours per weekday, 0 = Sunday … 6 = Saturday; null = closed. Minutes since midnight. */
export const HOURS: ({ open: number; close: number } | null)[] = [
  null,
  { open: 9 * 60, close: 18 * 60 },
  { open: 9 * 60, close: 18 * 60 },
  { open: 9 * 60, close: 18 * 60 },
  { open: 9 * 60, close: 18 * 60 },
  { open: 9 * 60, close: 18 * 60 },
  { open: 9 * 60, close: 12 * 60 },
];

export const HOURS_TEXT = [
  { days: "Maandag – vrijdag", hours: "09:00 – 18:00" },
  { days: "Zaterdag", hours: "09:00 – 12:00" },
  { days: "Zondag", hours: "Gesloten" },
];

const DAY_NAMES = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>;

function hhmm(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Weekday and minutes since midnight in Brussels for a moment in time. */
export function brusselsClock(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: WEEKDAY[get("weekday")] ?? 0, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpeningStatus = { open: boolean; text: string };

export function openingStatus(date: Date): OpeningStatus {
  const { day, minutes } = brusselsClock(date);
  const today = HOURS[day];
  if (today && minutes >= today.open && minutes < today.close) {
    return { open: true, text: `Nu open tot ${hhmm(today.close)}` };
  }
  if (today && minutes < today.open) {
    return { open: false, text: `Vandaag open van ${hhmm(today.open)} tot ${hhmm(today.close)}` };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = HOURS[(day + ahead) % 7];
    if (!next) continue;
    const when = ahead === 1 ? "morgen" : DAY_NAMES[(day + ahead) % 7];
    return { open: false, text: `Gesloten · ${when} open om ${hhmm(next.open)}` };
  }
  return { open: false, text: "Gesloten" };
}
