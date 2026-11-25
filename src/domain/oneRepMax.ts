/**
 * Estimated one-rep max. Epley: weight × (1 + reps / 30); a single rep is the weight itself.
 * The only 1RM formula in the app; swap it here (e.g. Brzycki) and every chart follows. Never stored.
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}
