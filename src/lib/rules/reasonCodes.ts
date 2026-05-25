// Structured reason codes returned by the compatibility engine. Severity
// drives the verdict: any `fail` => NO, else any `warn` => BORDERLINE, else
// PASS. `info` codes are advisory only and never change the verdict.

export type ReasonSeverity = "pass" | "info" | "warn" | "fail";

export type ReasonCode =
  | "FITS_ALL_DIMENSIONS"
  | "DIMENSION_LENGTH_EXCEEDED"
  | "DIMENSION_WIDTH_EXCEEDED"
  | "DIMENSION_HEIGHT_EXCEEDED"
  | "DIMENSION_LENGTH_BORDERLINE"
  | "DIMENSION_WIDTH_BORDERLINE"
  | "DIMENSION_HEIGHT_BORDERLINE"
  | "WEIGHT_LIMIT_EXCEEDED"
  | "WEIGHT_LIMIT_BORDERLINE"
  | "SOFT_SIDED_REQUIRED"
  | "SOFT_SIDED_RECOMMENDED"
  | "INCOMPLETE_RULE_DATA"
  | "AIRCRAFT_DATA_MISSING"
  | "PET_COMFORT_RISK"
  | "PET_COMFORT_UNCERTAIN"
  | "FINAL_APPROVAL_AIRLINE_DISCRETION";

export interface Reason {
  code: ReasonCode;
  severity: ReasonSeverity;
  message: string;
  // Which rule dimension the reason refers to, when applicable.
  dimension?: "length" | "width" | "height" | "weight";
}

export const REASON_LABELS: Record<ReasonCode, string> = {
  FITS_ALL_DIMENSIONS: "Fits all published size rules",
  DIMENSION_LENGTH_EXCEEDED: "Length exceeds the airline maximum",
  DIMENSION_WIDTH_EXCEEDED: "Width exceeds the airline maximum",
  DIMENSION_HEIGHT_EXCEEDED: "Height exceeds the airline maximum",
  DIMENSION_LENGTH_BORDERLINE: "Length is at the limit (soft bag may compress)",
  DIMENSION_WIDTH_BORDERLINE: "Width is at the limit (soft bag may compress)",
  DIMENSION_HEIGHT_BORDERLINE: "Height is at the limit (soft bag may compress)",
  WEIGHT_LIMIT_EXCEEDED: "Combined pet + carrier weight exceeds the limit",
  WEIGHT_LIMIT_BORDERLINE: "Combined weight is close to the limit",
  SOFT_SIDED_REQUIRED: "This airline requires a soft-sided carrier in cabin",
  SOFT_SIDED_RECOMMENDED: "A soft-sided carrier is recommended for this airline",
  INCOMPLETE_RULE_DATA: "Published size rules are incomplete for this airline/cabin",
  AIRCRAFT_DATA_MISSING: "Under-seat space varies by aircraft; provide a flight number for precision",
  PET_COMFORT_RISK: "Pet measurements suggest limited room to stand or turn",
  PET_COMFORT_UNCERTAIN: "No pet measurements provided; comfort could not be assessed",
  FINAL_APPROVAL_AIRLINE_DISCRETION: "Final acceptance is always at the airline's discretion at the gate",
};
