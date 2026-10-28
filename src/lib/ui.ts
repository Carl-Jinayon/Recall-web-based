const TRACK_COLORS = [
  "#2f6f64",
  "#5b6c8f",
  "#8a5a44",
  "#6d5a86",
  "#3f7a8a",
  "#4f7a52",
  "#9a554d",
  "#7a6a3f",
  "#526b7a",
  "#86614f",
  "#6b5b7a",
  "#5f6f5a",
];

export function trackColor(trackId: number): string {
  if (trackId <= 0) return "#6b675f";
  return TRACK_COLORS[(trackId - 1) % TRACK_COLORS.length];
}

export function depthClass(depth: string): string {
  const normalized = depth.toUpperCase();
  if (normalized.startsWith("DEEP")) return "depth-deep";
  if (normalized.startsWith("WORKING")) return "depth-working";
  if (normalized.startsWith("AWARE")) return "depth-aware";
  return "depth-other";
}

export function actionLabel(type: string): string {
  switch (type) {
    case "reviewed":
      return "Reviewed";
    case "postponed":
      return "Repeated tomorrow";
    case "mastered":
      return "Mastered";
    case "started":
      return "Started cycle";
    case "restarted":
      return "Restarted cycle";
    default:
      return "Updated";
  }
}
