import { Track } from "@prisma/client";

export const TRACK_STYLES: Record<Track, { bg: string; fg: string; label: string }> = {
  IB: { bg: "rgba(29,78,216,0.12)", fg: "#1d4ed8", label: "IB" },
  SAT: { bg: "rgba(201,162,39,0.16)", fg: "#a9840e", label: "SAT" },
  AP: { bg: "rgba(15,118,110,0.12)", fg: "#0f766e", label: "AP" },
  IGCSE: { bg: "rgba(124,58,237,0.12)", fg: "#7c3aed", label: "IGCSE" },
  BTEC: { bg: "rgba(8,145,178,0.12)", fg: "#0891b2", label: "BTEC" },
  EST: { bg: "rgba(219,39,119,0.12)", fg: "#db2777", label: "EST" },
};
