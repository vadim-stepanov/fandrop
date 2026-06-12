// A `datetime-local` input works in LOCAL time, but the DB stores UTC ISO.
// Convert the stored UTC value to the local "YYYY-MM-DDTHH:mm" the input shows,
// so the baseline matches the input (otherwise the field reads dirty forever
// after save) and `new Date(value).toISOString()` round-trips without shifting.
export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localMs).toISOString().slice(0, 16);
}
