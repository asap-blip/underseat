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
    softSidedRequirement: "recommended",
    aircraftVaries: false,
    notes: "Soft carrier max 55x40x27 cm. Pet + carrier must not exceed 10 kg.",
    sourceUrl:
      "https://www.aircanada.com/ca/en/aco/home/plan/special-assistance/pets.html",
    lastVerifiedAt: "2026-01-15",
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
      "No fixed published dimensions; soft carrier must fit fully under the seat in front of you. Under-seat space varies by aircraft.",
    sourceUrl: "https://www.delta.com/us/en/pet-travel/overview",
    lastVerifiedAt: "2026-01-10",
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
      "Soft carrier max 18x11x11 in. Hard carrier max 17.5x12x7.5 in. Under-seat clearance varies by aircraft.",
    sourceUrl:
      "https://www.united.com/en/us/fly/travel/special-needs/pets.html",
    lastVerifiedAt: "2026-01-12",
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
    notes: "Kennel max 19x13x9 in; soft-sided collapsible carriers preferred.",
    sourceUrl:
      "https://www.aa.com/i18n/travel-info/special-assistance/pets.jsp",
    lastVerifiedAt: "2026-01-08",
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
    notes: "Carrier max 18.5x8.5x13.5 in. Hard or soft permitted.",
    sourceUrl:
      "https://www.southwest.com/help/traveling-with-pets",
    lastVerifiedAt: "2026-01-09",
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
    softSidedRequirement: "required",
    aircraftVaries: false,
    notes:
      "Soft carrier only, max 17x12.5x8.5 in. Combined pet + carrier max 20 lb.",
    sourceUrl: "https://www.jetblue.com/traveling-together/traveling-with-pets",
    lastVerifiedAt: "2026-01-11",
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
    notes: "Soft carrier max 17x11x9.5 in; hard carrier max 17x11x7.5 in.",
    sourceUrl:
      "https://www.alaskaair.com/content/travel-info/policies/pets-traveling-with-pets",
    lastVerifiedAt: "2026-01-07",
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
    softSidedRequirement: "recommended",
    aircraftVaries: false,
    notes:
      "Carrier max 55x40x23 cm. Combined pet + carrier max 8 kg in cabin.",
    sourceUrl:
      "https://www.lufthansa.com/de/en/travelling-with-animals",
    lastVerifiedAt: "2026-01-14",
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
    softSidedRequirement: "recommended",
    aircraftVaries: true,
    notes:
      "Same carrier limits as economy, but lie-flat seat footwells vary by aircraft.",
    sourceUrl:
      "https://www.lufthansa.com/de/en/travelling-with-animals",
    lastVerifiedAt: "2026-01-14",
  },
];

const AMZ = "https://www.amazon.com/s?k=";
const affBase = (q: string) => `${AMZ}${encodeURIComponent(q)}`;

export const carriers: Carrier[] = [
  c("sherpa-original-md", "Sherpa", "Original Deluxe (Medium)", "SHP-OD-M", true, 43, 27, 27, 1.2, "verified", 6.8, 45, "Airline-favorite soft carrier with mesh panels."),
  c("sherpa-original-lg", "Sherpa", "Original Deluxe (Large)", "SHP-OD-L", true, 48, 29, 29, 1.5, "verified", 8.0, 55),
  c("sleepypod-air", "Sleepypod", "Air In-Cabin", "SLP-AIR", true, 55, 27, 27, 2.0, "verified", 4.5, 200, "Adjustable length to compress under the seat."),
  c("sturdibag-large", "SturdiBag", "Large Flexible-Height", "STB-LG", true, 46, 30, 30, 1.0, "verified", 4.5, 95, "Flex-height top collapses for under-seat fit."),
  c("sturdibag-small", "SturdiBag", "Small Flexible-Height", "STB-SM", true, 41, 25, 25, 0.9, "verified", 3.6, 80),
  c("petmate-two-door", "Petmate", "Two Door Top Load", "PTM-2DTL", false, 48, 32, 33, 2.5, "verified", 5.4, 40, "Hard-sided; better for cargo than most cabins."),
  c("amazonbasics-soft-sm", "Amazon Basics", "Soft-Sided (Small)", "AMZ-SS-S", true, 41, 28, 28, 1.0, "unverified", 4.0, 28),
  c("amazonbasics-soft-md", "Amazon Basics", "Soft-Sided (Medium)", "AMZ-SS-M", true, 49, 29, 29, 1.3, "unverified", 5.5, 33),
  c("kh-lookout", "K&H", "Lookout Pet Carrier", "KH-LO", true, 45, 28, 28, 1.1, "community", 4.5, 50),
  c("away-pet-carrier", "Away", "The Pet Carrier", "AWY-PC", true, 47, 28, 24, 1.6, "verified", 6.0, 250, "Premium soft carrier sized for under-seat."),
  c("diggs-passenger", "Diggs", "Passenger Travel Carrier", "DGS-PSG", true, 46, 28, 29, 1.8, "verified", 7.0, 175),
  c("mr-peanuts-aspen", "Mr. Peanut's", "Aspen Series", "MPN-ASP", true, 43, 27, 27, 1.0, "community", 4.5, 60),
  c("petsfit-expandable", "Petsfit", "Expandable Carrier", "PSF-EXP", true, 46, 28, 28, 1.4, "unverified", 5.0, 45, "Side panels expand once on the ground."),
  c("henkelion-small", "Henkelion", "Soft-Sided (Small)", "HKL-SS-S", true, 40, 21, 28, 0.8, "unverified", 3.2, 25),
  c("pawaboo-backpack", "Pawaboo", "Pet Travel Backpack", "PWB-BP", true, 32, 28, 42, 0.9, "community", 4.0, 40, "Backpack form factor; tall profile."),
  c("texsens-bubble", "Texsens", "Bubble Backpack", "TXS-BB", false, 42, 33, 28, 1.5, "community", 4.5, 55, "Semi-rigid bubble shell."),
  c("petsfit-sturdy", "Petsfit", "Sturdy Hard Carrier", "PSF-HARD", false, 50, 33, 33, 2.8, "unverified", 6.0, 70, "Large hard-sided; rarely cabin-legal."),
  c("elitefield-3door-lg", "EliteField", "3-Door Soft (Large)", "ELF-3D-L", true, 51, 33, 33, 1.7, "community", 6.5, 60, "Roomy but oversized for most cabins."),
  c("frisco-soft", "Frisco", "Soft-Sided Carrier", "FRS-SS", true, 44, 28, 28, 1.1, "verified", 4.8, 35),
  c("vceoa-small", "Vceoa", "Soft Carrier (Small)", "VCE-SS-S", true, 41, 28, 28, 0.9, "unverified", 3.8, 27),
  c("petmate-sky-100", "Petmate", "Sky Kennel 100", "PTM-SK100", false, 53, 38, 38, 3.5, "verified", 8.0, 45, "IATA cargo kennel; not a cabin carrier."),
  c("morpilot-expandable", "Morpilot", "Expandable Carrier", "MRP-EXP", true, 46, 28, 28, 1.3, "unverified", 5.0, 42),
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
