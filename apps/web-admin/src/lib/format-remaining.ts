// Single largest-whole-unit countdown label for store items & quests:
// "3 days" / "5 hours" / "12 minutes" / "< 1 minute".
export function formatRemainingSingleUnit(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    return totalDays === 1 ? "1 day" : `${totalDays} days`;
  }
  if (totalHours >= 1) {
    return totalHours === 1 ? "1 hour" : `${totalHours} hours`;
  }
  if (totalMinutes >= 1) {
    return totalMinutes === 1 ? "1 minute" : `${totalMinutes} minutes`;
  }
  return "< 1 minute";
}
