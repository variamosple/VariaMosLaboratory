import fs from "fs";
import { APIRequestContext } from "@playwright/test";
import { test, expect, env, showInList } from "../support/fixtures";

const API = `http://127.0.0.1:${env.BACKEND_PORT}`;
const unique = (name: string) => `${name} ${Date.now().toString(36)}`;

const api = (request: APIRequestContext) => {
  const headers = { Authorization: `Bearer ${fs.readFileSync(env.TOKEN_FILE, "utf8").trim()}` };
  return {
    get: (url: string) => request.get(API + url, { headers }),
    post: (url: string, data?: object) => request.post(API + url, { headers, data }),
    put: (url: string, data?: object) => request.put(API + url, { headers, data }),
  };
};

test.describe("LAB-EX-04 versions", () => {
  test("the history shows each version with author and change; two versions compare; a past one is restored", async ({ page, request }) => {
    const lab = api(request);
    const first = unique("History");
    const second = `${first} renamed`;
    const { id } = await (await lab.post("/experiments", { name: first, projectId: env.MODEL.projectId, hypothesis: "First hypothesis" })).json();
    expect((await lab.put(`/experiments/${id}`, { name: second, hypothesis: "Second hypothesis" })).status()).toBe(200);

    await page.goto("");
    await showInList(page, second);
    await page.getByRole("cell", { name: second, exact: true }).click();
    await page.getByRole("button", { name: "Version History" }).click();

    const history = page.getByRole("dialog").filter({ hasText: "Version History" });
    await expect(history).toContainText(`Changed experiment name from "${first}" to "${second}"`);
    await expect(history).toContainText("Updated hypothesis");
    await expect(history).toContainText("Experiment created");
    await expect(history).toContainText(env.USER.name);

    // Compare version 1 and version 2
    await history.getByRole("checkbox", { name: "Select version 1 to compare" }).first().check();
    await history.getByRole("checkbox", { name: "Select version 2 to compare" }).first().check();
    await history.getByRole("button", { name: "Compare Versions" }).click();
    // Opened above the history dialog
    const compare = page.getByRole("dialog").last();
    await expect(compare).toContainText("Compare Versions");
    await expect(compare).toContainText(first);
    await expect(compare).toContainText(second);
    await expect(compare).toContainText("First hypothesis");
    await expect(compare).toContainText("Second hypothesis");
    await expect(compare.getByText("Modified").first()).toBeVisible();
    await compare.getByRole("button", { name: "Close" }).last().click();

    // Restore version 1: saved as a new version 3
    const restored = page.waitForResponse((response) => response.url().endsWith(`/experiments/${id}/version/1/restore`));
    await history.locator(".card", { hasText: "Experiment created" }).getByRole("button", { name: "Restore" }).click();
    expect((await restored).status()).toBe(200);

    const detailed = await (await lab.get(`/experiments/${id}/detailed`)).json();
    expect(detailed).toMatchObject({ name: first, hypothesis: "First hypothesis", version: 3 });
    await expect(page.getByText(first, { exact: true }).first()).toBeVisible();
  });
});
