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
});

export const checkInputSchema = z.object({
  carrierId: z.string().min(1),
  pet: petSchema,
  legs: z.array(tripLegSchema).min(1).max(8),
});

export type CheckInputParsed = z.infer<typeof checkInputSchema>;
