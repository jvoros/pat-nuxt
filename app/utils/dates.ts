export function convertTime(time: string): string {
  const date = new Date(Number(time));
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
