export const  msFromString = (s: string) => {
  const num = Number(s.slice(0, -1));
  const unit = s.slice(-1);
  if (unit === "m") return num * 60 * 1000;
  if (unit === "h") return num * 60 * 60 * 1000;
  if (unit === "d") return num * 24 * 60 * 60 * 1000;
  // fallback minutes if "15m"
  return num * 60 * 1000;
}
