import { expect, test } from "@playwright/test";

test("landing page loads and links to the check flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Will this pet carrier fly/i })).toBeVisible();
  await page.getByRole("link", { name: "Check my carrier" }).click();
  await expect(page).toHaveURL(/\/check/);
});

test("carrier catalog renders and search filters", async ({ page }) => {
  await page.goto("/carriers");
  await expect(page.getByText("Sherpa")).toBeVisible();
  await page.getByPlaceholder(/Search by brand/i).fill("sleepypod");
  await expect(page.getByText("Air In-Cabin")).toBeVisible();
});

test("a full check produces a result with a verdict", async ({ page }) => {
  await page.goto("/check?carrier=petmate-sky-100");
  // Pick an airline with strict rules and a route.
  await page.locator("select").nth(2).selectOption("jetblue").catch(() => {});
  await page.getByPlaceholder("YYZ").first().fill("JFK");
  await page.getByPlaceholder("LHR").first().fill("BOS");
  await page.getByRole("button", { name: "Check compatibility" }).click();
  await expect(page).toHaveURL(/\/result/);
  await expect(page.getByText(/PASS|BORDERLINE|NO/).first()).toBeVisible();
});

test("rules directory shows sources and freshness", async ({ page }) => {
  await page.goto("/rules");
  await expect(page.getByRole("heading", { name: /Airline rules & sources/i })).toBeVisible();
  await expect(page.getByText("Air Canada — Travelling with pets").first()).toBeVisible();
  await expect(page.getByText(/Airline official/).first()).toBeVisible();
});

test("admin can update a rule's verification", async ({ request }) => {
  const res = await request.patch("/api/admin/rules/southwest-economy", {
    data: { lastVerifiedAt: "2026-05-25", sourceType: "third_party" },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.rule.lastVerifiedAt).toBe("2026-05-25");
});

test("admin can update a carrier's verification", async ({ request }) => {
  const res = await request.patch("/api/admin/carriers/frisco-soft", {
    data: { verification: "team_verified", verifiedAt: "2026-05-25", heightCm: 28 },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.carrier.verification).toBe("team_verified");
});

test("merchant demo embeds a working widget", async ({ page }) => {
  await page.goto("/merchant/petgearco");
  await expect(page.getByText(/Merchant demo/i)).toBeVisible();
  await page.getByRole("button", { name: "Check compatibility" }).click();
  await expect(page.getByText("Result")).toBeVisible();
});

test("/api/check returns a structured contract", async ({ request }) => {
  const res = await request.post("/api/check", {
    data: {
      carrierId: "sherpa-original-md",
      pet: { species: "cat", weightKg: 4 },
      legs: [{ airlineId: "air-canada", origin: "FRA", destination: "JFK", cabin: "economy" }],
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.result.overall).toBe("PASS");
  expect(body.shareToken).toBeTruthy();
});
