// Canonical domain types. All physical dimensions are stored in centimetres
// and all weights in kilograms internally; UI may convert for display.

export type CabinType = "economy" | "premium_economy" | "business" | "first";

export type PetSpecies = "dog" | "cat" | "rabbit" | "bird" | "other";

export type SoftSidedRequirement = "required" | "recommended" | null;

// Evidence-based carrier status. Drives a single primary badge + a secondary
// evidence line in the UI. Extensible: failed_check / needs_review are wired
// through the config even though the seed doesn't use them yet.
export type CarrierStatus =
  | "team_verified" // we checked this exact model/size against the airline's published rules
  | "traveler_reported" // travelers reported it worked; reviewed but not independently verified
  | "not_verified_yet" // not enough current data for this carrier yet
  | "failed_check" // doesn't match the airline rule data we have on file
  | "needs_review"; // needs manual review before we can label it

// Kept as an alias so existing references to the type name keep working.
export type VerificationStatus = CarrierStatus;

// Where a rule's numbers came from, so users can judge how much to trust them.
export type SourceType =
  | "airline_official" // the airline's own website/help center
  | "airline_pdf" // a downloadable airline policy document
  | "third_party" // an aggregator or travel publication
  | "community"; // user-reported, not yet confirmed against an official source

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  airline_official: "Airline official",
  airline_pdf: "Airline PDF",
  third_party: "Third party",
  community: "Community-reported",
};

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
  // When the carrier's dimensions were last confirmed (drives freshness).
  verifiedAt?: string | null;
  // Number of traveler reports on file (drives the "N traveler reports" line).
  travelerReports?: number | null;
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
  // Human-readable name of the source page/document.
  sourceLabel?: string | null;
  sourceType?: SourceType | null;
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
  // The carrier on the ticket (codeshare marketing carrier), if different from
  // the booking airline. Informational.
  marketedCarrierId?: string | null;
  // The carrier that actually operates the flight. When present and different,
  // it takes priority for rule evaluation (its pet policy is what applies).
  operatingCarrierId?: string | null;
  // Set when the traveler knows the flight is operated by a different airline
  // but that airline isn't in our modeled list. We do NOT substitute a modeled
  // airline; instead the leg is treated as indicative only (capped confidence).
  operatingCarrierUnknown?: boolean | null;
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
