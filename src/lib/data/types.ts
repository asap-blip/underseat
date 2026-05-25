// Canonical domain types. All physical dimensions are stored in centimetres
// and all weights in kilograms internally; UI may convert for display.

export type CabinType = "economy" | "premium_economy" | "business" | "first";

export type PetSpecies = "dog" | "cat" | "rabbit" | "bird" | "other";

export type SoftSidedRequirement = "required" | "recommended" | null;

export type VerificationStatus = "verified" | "unverified" | "community";

export interface Carrier {
  id: string;
  brand: string;
  model: string;
  sku: string;
  softSided: boolean;
  // Internal usable dimensions in centimetres.
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  // Empty carrier weight in kilograms.
  weightKg: number;
  // Manufacturer-stated max pet weight, if published (kg). Optional.
  maxPetWeightKg?: number | null;
  verification: VerificationStatus;
  imageUrl?: string | null;
  // Affiliate URL(s). The primary is used for outbound buttons; the map allows
  // per-network overrides that can be swapped by an admin later.
  affiliateUrl?: string | null;
  affiliateTargets?: Record<string, string>;
  priceUsd?: number | null;
  description?: string | null;
}

export interface Airline {
  id: string;
  name: string;
  iata: string;
  country?: string | null;
}

export interface AirlineRule {
  id: string;
  airlineId: string;
  cabin: CabinType;
  // Aircraft family this rule applies to, or null for the airline default.
  aircraftType?: string | null;
  // Maximum in-cabin carrier dimensions (cm). Null => not published.
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  // Combined pet + carrier weight limit (kg). Null => not published.
  maxCombinedWeightKg: number | null;
  softSidedRequirement: SoftSidedRequirement;
  // Set when under-seat clearance varies by aircraft on this airline, which
  // caps confidence unless a specific flight/aircraft is supplied.
  aircraftVaries: boolean;
  notes?: string | null;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
}

export interface Pet {
  id?: string;
  name?: string | null;
  species: PetSpecies;
  weightKg: number;
  // Optional body measurements (cm) for comfort assessment.
  lengthCm?: number | null; // nose to base of tail
  heightCm?: number | null; // floor to top of head/shoulder when standing
}

export interface TripLegInput {
  airlineId: string;
  origin: string;
  destination: string;
  cabin: CabinType;
  flightNumber?: string | null;
  aircraftType?: string | null;
}

export interface CheckInput {
  carrierId: string;
  pet: Pet;
  legs: TripLegInput[];
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string | null;
}

export interface MerchantProduct {
  id: string;
  merchantId: string;
  carrierId: string;
  externalProductId: string;
  productUrl?: string | null;
}

export interface ProductCode {
  // QR / barcode / shortcode -> carrier resolution.
  code: string;
  carrierId: string;
}
