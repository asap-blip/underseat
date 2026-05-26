import type {
  Airline,
  AirlineRule,
  Carrier,
  Merchant,
  MerchantProduct,
  ProductCode,
} from "./types";

// ---------------------------------------------------------------------------
// Canonical seed data. This is the single source of truth for development and
// for the static (no-database) data layer. `scripts/generate-sql-seed.ts`
// renders this same data into supabase/seed.sql so the two never drift.
//
// IMPORTANT: airline rule values below reflect publicly documented patterns at
// the time of seeding and are illustrative. They MUST be re-verified against
// each airline's live policy before being relied on. `sourceUrl` and
// `lastVerifiedAt` are populated so staleness is visible in the UI.
// ---------------------------------------------------------------------------

const inch = (n: number) => Number((n * 2.54).toFixed(1));
const lb = (n: number) => Number((n * 0.453592).toFixed(2));

export const airlines: Airline[] = [
  { id: "air-canada", name: "Air Canada", iata: "AC", country: "CA" },
  { id: "delta", name: "Delta Air Lines", iata: "DL", country: "US" },
  { id: "united", name: "United Airlines", iata: "UA", country: "US" },
  { id: "american", name: "American Airlines", iata: "AA", country: "US" },
  { id: "southwest", name: "Southwest Airlines", iata: "WN", country: "US" },
  { id: "jetblue", name: "JetBlue Airways", iata: "B6", country: "US" },
  { id: "alaska", name: "Alaska Airlines", iata: "AS", country: "US" },
  { id: "lufthansa", name: "Lufthansa", iata: "LH", country: "DE" },
  { id: "porter", name: "Porter Airlines", iata: "PD", country: "CA" },
  { id: "westjet", name: "WestJet", iata: "WS", country: "CA" },
  { id: "air-transat", name: "Air Transat", iata: "TS", country: "CA" },
  { id: "flair", name: "Flair Airlines", iata: "F8", country: "CA" },
];

export const airlineRules: AirlineRule[] = [
  {
    id: "air-canada-economy",
    airlineId: "air-canada",
    cabin: "economy",
    aircraftType: null,
    // Soft-sided allowance 55 x 40 x 27 cm; combined pet + carrier <= 10 kg.
    maxLengthCm: 55,
    maxWidthCm: 40,
    maxHeightCm: 27,
    maxCombinedWeightKg: 10,
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft-sided carrier required in cabin since 1 Jun 2025. Soft max 55x40x27 cm (hard 55x40x23 cm no longer permitted in cabin). Pet + carrier must not exceed 10 kg.",
    sourceUrl:
      "https://www.aircanada.com/ca/en/aco/home/plan/special-assistance/pets.html",
    sourceLabel: "Air Canada — Travelling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "delta-economy",
    airlineId: "delta",
    cabin: "economy",
    aircraftType: null,
    // Delta does not publish fixed maximums; carrier must fit under the seat,
    // which varies by aircraft. Modelled as incomplete + aircraft-variable.
    maxLengthCm: null,
    maxWidthCm: null,
    maxHeightCm: null,
    maxCombinedWeightKg: null,
    softSidedRequirement: "recommended",
    aircraftVaries: true,
    notes:
      "No guaranteed published maximum; the kennel must fit under the seat, which varies by aircraft. Delta recommends a soft kennel up to 18x11x11 in but confirms exact size by flight. Modelled as incomplete on purpose.",
    sourceUrl: "https://www.delta.com/us/en/pet-travel/overview",
    sourceLabel: "Delta — Pet travel overview",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "united-economy",
    airlineId: "united",
    cabin: "economy",
    aircraftType: null,
    // Hard 44.5x30.5x19, soft 45.7x27.9x27.9. We model the soft allowance.
    maxLengthCm: inch(18),
    maxWidthCm: inch(11),
    maxHeightCm: inch(11),
    maxCombinedWeightKg: null,
    softSidedRequirement: "recommended",
    aircraftVaries: true,
    notes:
      "Soft carrier max 18x11x11 in (modelled). Hard carrier max 17.5x12x9 in. No published weight limit. Under-seat clearance varies by aircraft.",
    sourceUrl:
      "https://www.united.com/en/us/fly/travel/special-needs/pets.html",
    sourceLabel: "United — Travelling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "american-economy",
    airlineId: "american",
    cabin: "economy",
    aircraftType: null,
    maxLengthCm: inch(19),
    maxWidthCm: inch(13),
    maxHeightCm: inch(9),
    maxCombinedWeightKg: null,
    softSidedRequirement: "recommended",
    aircraftVaries: false,
    notes:
      "Hard kennel max 19x13x9 in (modelled); soft carrier max 18x11x11 in and preferred. Combined weight commonly cited as ~20 lb but AA does not publish a single in-cabin figure, so weight is left unmodeled — confirm with AA.",
    sourceUrl:
      "https://www.aa.com/i18n/travel-info/special-assistance/pets.jsp",
    sourceLabel: "American Airlines — Traveling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "southwest-economy",
    airlineId: "southwest",
    cabin: "economy",
    aircraftType: null,
    maxLengthCm: inch(18.5),
    maxWidthCm: inch(8.5),
    maxHeightCm: inch(13.5),
    maxCombinedWeightKg: null,
    softSidedRequirement: null,
    aircraftVaries: false,
    notes:
      "Carrier max 18.5x8.5x13.5 in; hard or soft permitted. Sources differ on the small dimension (8.5 vs 9.5 in) — we use the more conservative 8.5 in. No published weight limit.",
    sourceUrl:
      "https://www.southwest.com/help/traveling-with-pets",
    sourceLabel: "Southwest — Traveling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "jetblue-economy",
    airlineId: "jetblue",
    cabin: "economy",
    aircraftType: null,
    maxLengthCm: inch(17),
    maxWidthCm: inch(12.5),
    maxHeightCm: inch(8.5),
    maxCombinedWeightKg: lb(20),
    softSidedRequirement: "recommended",
    aircraftVaries: false,
    notes:
      "Carrier max 17x12.5x8.5 in. Both soft and hard carriers are allowed; soft is preferred. Combined pet + carrier max 20 lb.",
    sourceUrl: "https://www.jetblue.com/traveling-together/traveling-with-pets",
    sourceLabel: "JetBlue — Traveling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "alaska-economy",
    airlineId: "alaska",
    cabin: "economy",
    aircraftType: null,
    // Soft 17x11x9.5 in (hard slightly less tall).
    maxLengthCm: inch(17),
    maxWidthCm: inch(11),
    maxHeightCm: inch(9.5),
    maxCombinedWeightKg: null,
    softSidedRequirement: "recommended",
    aircraftVaries: false,
    notes:
      "Soft carrier max 17x11x9.5 in (modelled); hard carrier max 17x11x7.5 in. No published weight limit; hard carriers may not fit under all aircraft seats.",
    sourceUrl:
      "https://www.alaskaair.com/content/travel-info/policies/pets-traveling-with-pets",
    sourceLabel: "Alaska Airlines — Pets traveling with you",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "lufthansa-economy",
    airlineId: "lufthansa",
    cabin: "economy",
    aircraftType: null,
    maxLengthCm: 55,
    maxWidthCm: 40,
    maxHeightCm: 23,
    maxCombinedWeightKg: 8,
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft-sided carrier required in cabin. Carrier max 55x40x23 cm. Combined pet + carrier max 8 kg in cabin.",
    sourceUrl:
      "https://www.lufthansa.com/de/en/travelling-with-animals",
    sourceLabel: "Lufthansa — Travelling with animals",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  // A business-cabin variant to demonstrate cabin-specific differences.
  {
    id: "lufthansa-business",
    airlineId: "lufthansa",
    cabin: "business",
    aircraftType: null,
    maxLengthCm: 55,
    maxWidthCm: 40,
    maxHeightCm: 23,
    maxCombinedWeightKg: 8,
    softSidedRequirement: "required",
    aircraftVaries: true,
    notes:
      "Soft-sided carrier required. Same 55x40x23 cm / 8 kg limits as economy, but lie-flat seat footwells vary by aircraft.",
    sourceUrl:
      "https://www.lufthansa.com/de/en/travelling-with-animals",
    sourceLabel: "Lufthansa — Travelling with animals (business)",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "porter-economy",
    airlineId: "porter",
    cabin: "economy",
    aircraftType: null,
    // Soft-sided only; 55 x 40 x 23 cm (22 x 16 x 9 in); pet + carrier <= 9 kg.
    maxLengthCm: 55,
    maxWidthCm: 40,
    maxHeightCm: 23,
    maxCombinedWeightKg: 9,
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft-sided carrier only. Max 55x40x23 cm (22x16x9 in). Combined pet + carrier max 9 kg (20 lb). Must fit under the seat.",
    sourceUrl: "https://www.flyporter.com/en-ca/travel-information/baggage/pets",
    sourceLabel: "Porter Airlines — Travelling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "westjet-economy",
    airlineId: "westjet",
    cabin: "economy",
    aircraftType: null,
    // Soft-sided; 16 x 8.5 x 10 in; pet + carrier <= 10 kg.
    maxLengthCm: inch(16),
    maxWidthCm: inch(8.5),
    maxHeightCm: inch(10),
    maxCombinedWeightKg: 10,
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft-sided carrier required in cabin. Max 16x8.5x10 in (41x21.6x25.4 cm). Combined pet + carrier max 10 kg (22 lb).",
    sourceUrl: "https://www.westjet.com/en-ca/pets",
    sourceLabel: "WestJet — Travelling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "air-transat-economy",
    airlineId: "air-transat",
    cabin: "economy",
    aircraftType: null,
    // Soft-sided only (hard not permitted); 43 L x 24 W x 25 H cm; <= 8 kg.
    maxLengthCm: 43,
    maxWidthCm: 24,
    maxHeightCm: 25,
    maxCombinedWeightKg: 8,
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft-sided carrier required (hard-sided not permitted in cabin). Max 43x24x25 cm (17x9x10 in). Combined pet + carrier max 8 kg.",
    sourceUrl: "https://www.airtransat.com/en-CA/forms/pet-information",
    sourceLabel: "Air Transat — Travelling with pets",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
  {
    id: "flair-economy",
    airlineId: "flair",
    cabin: "economy",
    aircraftType: null,
    // Soft-sided; 41 x 23 x 25 cm (16 x 9 x 10 in); <= 10.4 kg. Domestic Canada only.
    maxLengthCm: 41,
    maxWidthCm: 23,
    maxHeightCm: 25,
    maxCombinedWeightKg: 10.4,
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft-sided carrier required. Max 41x23x25 cm (16x9x10 in). Combined pet + carrier max 10.4 kg (23 lb). In-cabin pets on domestic Canada flights only — not offered on US/international routes.",
    sourceUrl: "https://www.flyflair.com/travel-info/baggage/pets-onboard",
    sourceLabel: "Flair Airlines — Pets onboard",
    sourceType: "airline_official",
    lastVerifiedAt: "2026-05-26",
  },
];

const AMZ = "https://www.amazon.com/s?k=";
const affBase = (q: string) => `${AMZ}${encodeURIComponent(q)}`;

export const carriers: Carrier[] = [
  c("sherpa-original-md", "Sherpa", "Original Deluxe (Medium)", "SHP-OD-M", true, 43, 27, 27, 1.2, "team_verified", 6.8, 45, "Airline-favorite soft carrier with mesh panels."),
  c("sherpa-original-lg", "Sherpa", "Original Deluxe (Large)", "SHP-OD-L", true, 48, 29, 29, 1.5, "team_verified", 8.0, 55),
  c("sleepypod-air", "Sleepypod", "Air In-Cabin", "SLP-AIR", true, 55, 27, 27, 2.0, "team_verified", 4.5, 200, "Adjustable length to compress under the seat."),
  c("sturdibag-large", "SturdiBag", "Large Flexible-Height", "STB-LG", true, 46, 30, 30, 1.0, "team_verified", 4.5, 95, "Flex-height top collapses for under-seat fit."),
  c("sturdibag-small", "SturdiBag", "Small Flexible-Height", "STB-SM", true, 41, 25, 25, 0.9, "team_verified", 3.6, 80),
  c("petmate-two-door", "Petmate", "Two Door Top Load", "PTM-2DTL", false, 48, 32, 33, 2.5, "team_verified", 5.4, 40, "Hard-sided; better for cargo than most cabins."),
  c("amazonbasics-soft-sm", "Amazon Basics", "Soft-Sided (Small)", "AMZ-SS-S", true, 41, 28, 28, 1.0, "not_verified_yet", 4.0, 28),
  c("amazonbasics-soft-md", "Amazon Basics", "Soft-Sided (Medium)", "AMZ-SS-M", true, 49, 29, 29, 1.3, "not_verified_yet", 5.5, 33),
  c("kh-lookout", "K&H", "Lookout Pet Carrier", "KH-LO", true, 45, 28, 28, 1.1, "traveler_reported", 4.5, 50),
  c("away-pet-carrier", "Away", "The Pet Carrier", "AWY-PC", true, 47, 28, 24, 1.6, "team_verified", 6.0, 250, "Premium soft carrier sized for under-seat."),
  c("diggs-passenger", "Diggs", "Passenger Travel Carrier", "DGS-PSG", true, 46, 28, 29, 1.8, "team_verified", 7.0, 175),
  c("mr-peanuts-aspen", "Mr. Peanut's", "Aspen Series", "MPN-ASP", true, 43, 27, 27, 1.0, "traveler_reported", 4.5, 60),
  c("petsfit-expandable", "Petsfit", "Expandable Carrier", "PSF-EXP", true, 46, 28, 28, 1.4, "not_verified_yet", 5.0, 45, "Side panels expand once on the ground."),
  c("henkelion-small", "Henkelion", "Soft-Sided (Small)", "HKL-SS-S", true, 40, 21, 28, 0.8, "not_verified_yet", 3.2, 25),
  c("pawaboo-backpack", "Pawaboo", "Pet Travel Backpack", "PWB-BP", true, 32, 28, 42, 0.9, "traveler_reported", 4.0, 40, "Backpack form factor; tall profile."),
  c("texsens-bubble", "Texsens", "Bubble Backpack", "TXS-BB", false, 42, 33, 28, 1.5, "traveler_reported", 4.5, 55, "Semi-rigid bubble shell."),
  c("petsfit-sturdy", "Petsfit", "Sturdy Hard Carrier", "PSF-HARD", false, 50, 33, 33, 2.8, "not_verified_yet", 6.0, 70, "Large hard-sided; rarely cabin-legal."),
  c("elitefield-3door-lg", "EliteField", "3-Door Soft (Large)", "ELF-3D-L", true, 51, 33, 33, 1.7, "traveler_reported", 6.5, 60, "Roomy but oversized for most cabins."),
  c("frisco-soft", "Frisco", "Soft-Sided Carrier", "FRS-SS", true, 44, 28, 28, 1.1, "team_verified", 4.8, 35),
  c("vceoa-small", "Vceoa", "Soft Carrier (Small)", "VCE-SS-S", true, 41, 28, 28, 0.9, "not_verified_yet", 3.8, 27),
  c("petmate-sky-100", "Petmate", "Sky Kennel 100", "PTM-SK100", false, 53, 38, 38, 3.5, "team_verified", 8.0, 45, "IATA cargo kennel; not a cabin carrier."),
  c("morpilot-expandable", "Morpilot", "Expandable Carrier", "MRP-EXP", true, 46, 28, 28, 1.3, "not_verified_yet", 5.0, 42),
];

function c(
  id: string,
  brand: string,
  model: string,
  sku: string,
  softSided: boolean,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  weightKg: number,
  verification: Carrier["verification"],
  maxPetWeightKg: number,
  priceUsd: number,
  description?: string,
): Carrier {
  return {
    id,
    brand,
    model,
    sku,
    softSided,
    lengthCm,
    widthCm,
    heightCm,
    weightKg,
    maxPetWeightKg,
    verification,
    verifiedAt: verification === "team_verified" ? "2026-03-15" : null,
    travelerReports: verification === "traveler_reported" ? 2 : null,
    imageUrl: null,
    affiliateUrl: affBase(`${brand} ${model} pet carrier`),
    affiliateTargets: {
      amazon: affBase(`${brand} ${model} pet carrier`),
      chewy: `https://www.chewy.com/s?query=${encodeURIComponent(`${brand} ${model}`)}`,
    },
    priceUsd,
    description: description ?? null,
  };
}

export const productCodes: ProductCode[] = [
  { code: "FPP-SHP-OD-M", carrierId: "sherpa-original-md" },
  { code: "FPP-SLP-AIR", carrierId: "sleepypod-air" },
  { code: "FPP-STB-LG", carrierId: "sturdibag-large" },
  { code: "FPP-AWY-PC", carrierId: "away-pet-carrier" },
  { code: "FPP-DGS-PSG", carrierId: "diggs-passenger" },
  { code: "FPP-PTM-SK100", carrierId: "petmate-sky-100" },
];

export const merchants: Merchant[] = [
  { id: "petgearco", name: "PetGear Co.", slug: "petgearco", websiteUrl: "https://example.com/petgearco" },
  { id: "traveltails", name: "Travel Tails", slug: "traveltails", websiteUrl: "https://example.com/traveltails" },
];

export const merchantProducts: MerchantProduct[] = [
  { id: "mp-1", merchantId: "petgearco", carrierId: "sherpa-original-md", externalProductId: "PG-1001", productUrl: "https://example.com/petgearco/products/PG-1001" },
  { id: "mp-2", merchantId: "petgearco", carrierId: "sturdibag-large", externalProductId: "PG-1002", productUrl: "https://example.com/petgearco/products/PG-1002" },
  { id: "mp-3", merchantId: "traveltails", carrierId: "away-pet-carrier", externalProductId: "TT-555", productUrl: "https://example.com/traveltails/products/TT-555" },
  { id: "mp-4", merchantId: "traveltails", carrierId: "diggs-passenger", externalProductId: "TT-556", productUrl: "https://example.com/traveltails/products/TT-556" },
];
