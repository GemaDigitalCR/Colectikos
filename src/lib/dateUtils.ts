export function getCRDate(date: Date = new Date()) {
  // Costa Rica is UTC-6
  return new Date(date.getTime() - 6 * 60 * 60 * 1000);
}

export function isSameCRDay(date1: Date | string | number, date2: Date | string | number) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const cr1 = getCRDate(d1);
  const cr2 = getCRDate(d2);
  
  return (
    cr1.getUTCFullYear() === cr2.getUTCFullYear() &&
    cr1.getUTCMonth() === cr2.getUTCMonth() &&
    cr1.getUTCDate() === cr2.getUTCDate()
  );
}

export function getCRStartOfDayUTC(date: Date = new Date()) {
  // Returns a UTC Date object that represents 00:00:00 local CR time for the given date.
  const cr = getCRDate(date);
  const crStart = new Date(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate(), 0, 0, 0, 0));
  // Shift it back to actual UTC time by adding 6 hours (because CR is UTC-6)
  return new Date(crStart.getTime() + 6 * 60 * 60 * 1000);
}

export function getCRStartOfMonthUTC(date: Date = new Date()) {
  // Returns a UTC Date object that represents 00:00:00 on the 1st of the current month in CR time (UTC-6)
  const cr = getCRDate(date);
  const crStart = new Date(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), 1, 0, 0, 0, 0));
  return new Date(crStart.getTime() + 6 * 60 * 60 * 1000);
}
