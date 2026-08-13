import { expect, test } from "@playwright/test";

test("idea approval leaves the wall and pipeline navigation works", async ({ page }) => {
  await page.goto("/ideas");
  await expect(page.getByRole("heading", { name: "Idea wall" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Idea wall" }).getByRole("article")).toHaveCount(4);
  await page.getByRole("button", { name: "Approve and validate" }).first().click();
  await expect(page.getByRole("region", { name: "Idea wall" }).getByRole("article")).toHaveCount(3);
  await page.getByRole("link", { name: "Pipeline" }).click();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
});

test("custom generation exposes reference and channel inputs", async ({ page }) => {
  await page.goto("/ideas");
  await page.getByRole("button", { name: "Generate from context" }).click();
  await expect(page.getByRole("dialog", { name: "Generate ideas from context" })).toBeVisible();
  await expect(page.getByLabel("Content objective or context")).toBeVisible();
  await expect(page.getByLabel("Reference URL")).toBeVisible();
  await expect(page.getByText("Primary/official · web/news · X · LinkedIn · YouTube · Instagram · Reddit · specialist sources.")).toBeVisible();
});

test("navigation and calendar remain usable at the current viewport", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Weekly content calendar" })).toBeVisible();
  await page.getByRole("link", { name: "Ideas" }).click();
  await expect(page.getByRole("heading", { name: "Idea wall" })).toBeVisible();
});
