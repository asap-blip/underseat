import { z } from "zod";

export const cabinSchema = z.enum([
  "economy",
  "premium_economy",
  "business",
  "first",
]);

export const speciesSchema = z.enum(["dog", "cat", "rabbit", "bird", "other"]);

export const petSchema = z.object({
  name: z.string().max(80).optional().nullable(),
  species: speciesSchema,
  weightKg: z.number().positive().max(50),
  lengthCm: z.number().positive().max(200).optional().nullable(),
  heightCm: z.number().positive().max(200).optional().nullable(),
});

export const tripLegSchema = z.object({
  airlineId: z.string().min(1),
  origin: z.string().min(2).max(6),
  destination: z.string().min(2).max(6),
  cabin: cabinSchema,
  flightNumber: z.string().max(10).optional().nullable(),
  aircraftType: z.string().max(40).optional().nullable(),
  marketedCarrierId: z.string().max(60).optional().nullable(),
  operatingCarrierId: z.string().max(60).optional().nullable(),
  operatingCarrierUnknown: z.boolean().optional().nullable(),
});

export const checkInputSchema = z.object({
  carrierId: z.string().min(1).optional(),
  carrierDimensions: z
    .object({
      lengthCm: z.number().positive().max(200),
      widthCm: z.number().positive().max(200),
      heightCm: z.number().positive().max(200),
      softSided: z.boolean().default(true),
    })
    .optional(),
  pet: petSchema,
  legs: z.array(tripLegSchema).min(1).max(8),
}).refine((d) => Boolean(d.carrierId) !== Boolean(d.carrierDimensions), {
  message: "Provide either carrierId or carrierDimensions, not both or neither.",
  path: ["carrierId"],
});

export type CheckInputParsed = z.infer<typeof checkInputSchema>;

export const sourceTypeSchema = z.enum([
  "airline_official",
  "airline_pdf",
  "third_party",
  "community",
]);

// Editable fields for the admin rule-update workflow. All optional (PATCH-style).
// `nullable` fields accept null to clear a value.
export const ruleUpdateSchema = z
  .object({
    maxLengthCm: z.number().positive().max(200).nullable(),
    maxWidthCm: z.number().positive().max(200).nullable(),
    maxHeightCm: z.number().positive().max(200).nullable(),
    maxCombinedWeightKg: z.number().positive().max(100).nullable(),
    softSidedRequirement: z.enum(["required", "recommended"]).nullable(),
    aircraftVaries: z.boolean(),
    notes: z.string().max(500).nullable(),
    sourceUrl: z.string().url().max(500).nullable(),
    sourceLabel: z.string().max(200).nullable(),
    sourceType: sourceTypeSchema.nullable(),
    lastVerifiedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .nullable(),
  })
  .partial();

export type RuleUpdateParsed = z.infer<typeof ruleUpdateSchema>;

export const verificationSchema = z.enum([
  "team_verified",
  "traveler_reported",
  "not_verified_yet",
  "failed_check",
  "needs_review",
]);

// Editable fields for the admin carrier-update workflow (PATCH-style).
export const carrierUpdateSchema = z
  .object({
    lengthCm: z.number().positive().max(200),
    widthCm: z.number().positive().max(200),
    heightCm: z.number().positive().max(200),
    weightKg: z.number().positive().max(50),
    maxPetWeightKg: z.number().positive().max(100).nullable(),
    softSided: z.boolean(),
    verification: verificationSchema,
    verifiedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .nullable(),
    affiliateUrl: z.string().url().max(500).nullable(),
  })
  .partial();

export type CarrierUpdateParsed = z.infer<typeof carrierUpdateSchema>;

// "Request an airline" capture. Only the airline name is required.
export const airlineRequestSchema = z.object({
  airline: z.string().min(2).max(80),
  cabin: z.string().max(40).optional().nullable(),
  email: z.string().email().max(160).optional().or(z.literal("")).nullable(),
  note: z.string().max(300).optional().nullable(),
});

export type AirlineRequestParsed = z.infer<typeof airlineRequestSchema>;

// "Suggest a carrier" capture. Only the carrier name is required.
export const carrierRequestSchema = z.object({
  carrier: z.string().min(2).max(120),
  email: z.string().email().max(160).optional().or(z.literal("")).nullable(),
  note: z.string().max(300).optional().nullable(),
});

export type CarrierRequestParsed = z.infer<typeof carrierRequestSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

// Trip follow-up opt-in capture. Email + departure date + consent are required.
export const tripFollowupSchema = z.object({
  email: z.string().email().max(160),
  carrierId: z.string().max(60).optional().nullable(),
  airlineId: z.string().max(60).optional().nullable(),
  departureDate: isoDate,
  returnDate: isoDate.optional().nullable().or(z.literal("")),
  routeText: z.string().max(200).optional().nullable(),
  consentFollowup: z.boolean(),
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(120).optional().nullable(),
});

export type TripFollowupParsed = z.infer<typeof tripFollowupSchema>;

// Traveler response to a follow-up email. Friendly outcome tokens map to the
// traveler_reports.outcome CHECK values (accepted/denied/unsure) at write time.
export const travelerOutcomeSchema = z.enum(["worked", "did_not_work", "mixed"]);
export const travelerStageSchema = z.enum(["check_in", "gate", "boarding", "onboard"]);

export const travelerResponseSchema = z.object({
  followupId: z.string().uuid(),
  outcome: travelerOutcomeSchema,
  stage: travelerStageSchema.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type TravelerResponseParsed = z.infer<typeof travelerResponseSchema>;

// Admin moderation of a traveler report.
export const moderationSchema = z.object({
  moderationStatus: z.enum(["needs_review", "approved", "rejected", "spam"]),
});

export type ModerationParsed = z.infer<typeof moderationSchema>;
