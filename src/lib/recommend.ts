import type { Carrier } from "@/lib/data/types";

// Reverse search: given a pet, suggest carriers from the carrier list that
// are LIKELY to fit. This is deliberately conservative and honest — it is a
// size/weight heuristic, not a guarantee, and it never claims a pet will be
// comfortable or accepted (airline rules are checked separately downstream).

export type FitBand = "good" | "snug" | "unlikely";

export interface PetInput {
  weightKg: number;
  lengthCm?: number | null; // nose to base of tail
  heightCm?: number | null; // floor to shoulder/top of head when standing
}

export interface CarrierRecommendation {
  carrier: Carrier;
  fit: FitBand;
  reasons: string[];
  lengthHeadroomCm: number | null;
  heightHeadroomCm: number | null;
  weightOk: boolean;
  measurementsUsed: boolean;
}

// Interior space is approximated as the outer dimensions less a wall allowance.
const WALL_ALLOWANCE_CM = 2;
// Below this headroom a fit is "snug" rather than comfortably "good".
const SNUG_HEADROOM_CM = 4;

function round(n: number): number {
  return Math.round(n);
}

export function recommendCarriers(pet: PetInput, carriers: Carrier[]): CarrierRecommendation[] {
  const recs = carriers.map((carrier) => evaluateFit(pet, carrier));

  const fitRank: Record<FitBand, number> = { good: 0, snug: 1, unlikely: 2 };
  const volume = (c: Carrier) => c.lengthCm * c.widthCm * c.heightCm;

  return recs.sort((a, b) => {
    if (fitRank[a.fit] !== fitRank[b.fit]) return fitRank[a.fit] - fitRank[b.fit];
    // Among equal fit, prefer verified, then smaller (more airline-friendly).
    const av = a.carrier.verification === "team_verified" ? 0 : 1;
    const bv = b.carrier.verification === "team_verified" ? 0 : 1;
    if (av !== bv) return av - bv;
    return volume(a.carrier) - volume(b.carrier);
  });
}

function evaluateFit(pet: PetInput, carrier: Carrier): CarrierRecommendation {
  const reasons: string[] = [];
  const measurementsUsed = pet.lengthCm != null || pet.heightCm != null;

  const interiorLength = carrier.lengthCm - WALL_ALLOWANCE_CM;
  const interiorHeight = carrier.heightCm - WALL_ALLOWANCE_CM;

  const lengthHeadroomCm = pet.lengthCm != null ? Number((interiorLength - pet.lengthCm).toFixed(1)) : null;
  const heightHeadroomCm = pet.heightCm != null ? Number((interiorHeight - pet.heightCm).toFixed(1)) : null;

  const weightOk = carrier.maxPetWeightKg == null ? true : pet.weightKg <= carrier.maxPetWeightKg;

  // Determine fit.
  let fit: FitBand = "good";
  const headrooms = [lengthHeadroomCm, heightHeadroomCm].filter((h): h is number => h != null);
  if (!weightOk || headrooms.some((h) => h < 0)) {
    fit = "unlikely";
  } else if (headrooms.length > 0 && Math.min(...headrooms) < SNUG_HEADROOM_CM) {
    fit = "snug";
  } else if (headrooms.length === 0) {
    // No measurements: we can only judge weight. Stay cautious.
    fit = weightOk ? "good" : "unlikely";
  }

  // Build plain-language reasons.
  if (lengthHeadroomCm != null) {
    reasons.push(
      lengthHeadroomCm >= 0
        ? `About ${round(lengthHeadroomCm)} cm of length to spare inside`
        : `Roughly ${round(-lengthHeadroomCm)} cm too short for your pet's length`,
    );
  }
  if (heightHeadroomCm != null) {
    reasons.push(
      heightHeadroomCm >= 0
        ? `About ${round(heightHeadroomCm)} cm of standing height to spare`
        : `Roughly ${round(-heightHeadroomCm)} cm too short for your pet to stand`,
    );
  }
  if (carrier.maxPetWeightKg != null) {
    reasons.push(
      weightOk
        ? `Rated for pets up to ${carrier.maxPetWeightKg} kg`
        : `Your pet is over its ${carrier.maxPetWeightKg} kg rating`,
    );
  }
  if (carrier.softSided) reasons.push("Soft-sided, so it fits more airline cabins");
  if (carrier.verification === "team_verified") reasons.push("Dimensions verified by our team");
  if (!measurementsUsed) reasons.push("Based on weight only — add measurements for a size check");

  return { carrier, fit, reasons, lengthHeadroomCm, heightHeadroomCm, weightOk, measurementsUsed };
}
