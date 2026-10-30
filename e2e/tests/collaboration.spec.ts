import fs from "fs";
import { APIRequestContext } from "@playwright/test";
import { test, expect, env, showInList } from "../support/fixtures";

const API = `http://127.0.0.1:${env.BACKEND_PORT}`;
const unique = (name: string) => `${name} ${Date.now().toString(36)}`;

const api = (request: APIRequestContext, second = false) => {
  const headers = { Authorization: `Bearer ${fs.readFileSync(second ? env.TOKEN2_FILE : env.TOKEN_FILE, "utf8").trim()}` };
  return {
    get: (url: string) => request.get(API + url, { headers }),
    post: (url: string, data?: object) => request.post(API + url, { headers, data }),
    put: (url: string, data?: object) => request.put(API + url, { headers, data }),
  };
};

const z3 = { version: "4.13.0", timeOut: 30, randomSeed: 7, mode: "enumeration" };

async function experiment(request: APIRequestContext, name: string) {
  const lab = api(request);
  const catalog = await (await lab.get("/metrics/public")).json();
  return (await (await lab.post("/experiments", {
    name,
    projectId: env.MODEL.projectId,
    metrics: [catalog.find((m: any) => m.name === "Number of products").id],
    scenarios: [{ name: "Car", modelIds: [env.MODEL.id], solverConfigs: { z3 } }],
  })).json());
}

test.describe("LAB-COL-01 sharing with separate permissions", () => {
  test("shared to run but not to edit: the second researcher sees Run, not Edit", async ({ page, secondPage, request }) => {
    const name = unique("Run only");
    const created = await experiment(request, name);
    await api(request).put(`/experiments/${created.id}/ready`);

    // Dana shares from the list: execute, not write
    await page.goto("");
    await page.getByRole("row", { name: new RegExp(name) }).getByRole("button", { name: "Share experiment" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("User Email").fill(env.USER2.email);
    await dialog.getByLabel(/^Execute/).check();
    await dialog.getByRole("button", { name: "Invite" }).click();
    await expect(page.locator(".ajs-message", { hasText: "shared successfully" })).toBeVisible();

    const [eli] = (await (await api(request).get(`/experiments/${created.id}/collaborators`)).json()).filter((c: any) => c.id === env.USER2.id);
    expect(eli.permissions).toEqual({ read: true, write: false, execute: true, manage: false });

    // Eli's view
    await secondPage.goto("");
    await secondPage.getByRole("tab", { name: "Shared with me" }).click();
    await showInList(secondPage, name);
    const row = secondPage.getByRole("row", { name: new RegExp(name) });
    await expect(row).toContainText(env.USER.name);
    await expect(row.getByRole("button", { name: "Edit experiment" })).toHaveCount(0);
    await row.getByRole("cell", { name, exact: true }).click();
    await expect(secondPage.getByRole("button", { name: "Run Experiment" })).toBeEnabled();
    await expect(secondPage.getByRole("button", { name: "Edit Experiment" })).toHaveCount(0);
    await expect(secondPage.getByRole("button", { name: "Mark as Ready" })).toHaveCount(0);
  });
});

test.describe("LAB-COL-02 editing at the same time", () => {
  test("a change by another researcher shows up; saving over it shows what they changed first", async ({ page, request }) => {
    const name = unique("Edited by two");
    const created = await experiment(request, name);
    await api(request).post(`/experiments/${created.id}/share`, { userEmail: env.USER2.email, permissions: { write: true, execute: false } });

    await page.goto("");
    await showInList(page, name);
    await page.getByRole("cell", { name, exact: true }).click();

    // Eli saves while Dana looks at the page: it shows within seconds
    expect((await api(request, true).put(`/experiments/${created.id}`, { expectedVersion: 1, hypothesis: "Eli's hypothesis" })).status()).toBe(200);
    await expect(page.getByRole("status", { name: "Changed by another user" })).toContainText("Version 2 was saved by another user", { timeout: 10_000 });

    // Dana edits from version 2; Eli saves version 3 meanwhile
    await page.getByRole("button", { name: "Edit Experiment" }).click();
    await page.getByRole("textbox", { name: "Description of the experiment" }).fill("Dana's description");
    expect((await api(request, true).put(`/experiments/${created.id}`, { expectedVersion: 2, name: `${name} (Eli)` })).status()).toBe(200);
    await expect(page.getByRole("status").filter({ hasText: "was saved by another user while you edit" })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Save Changes" }).click();
    const conflict = page.getByRole("dialog");
    await expect(conflict).toContainText("Someone saved version 3 while you were editing version 2.");
    await expect(conflict).toContainText(`Version 3 by ${env.USER2.name}: name changed`);

    await conflict.getByRole("button", { name: "Save mine over theirs" }).click();
    await expect.poll(async () => (await (await api(request).get(`/experiments/${created.id}/detailed`)).json()).version).toBe(4);
    const saved = await (await api(request).get(`/experiments/${created.id}/detailed`)).json();
    expect(saved.description).toBe("Dana's description");
  });
});

test.describe("LAB-COL-03 comments", () => {
  test("comments on a scenario, a run and a result metric, seen and answered by the second researcher", async ({ page, secondPage, request }) => {
    const name = unique("Discussed");
    const created = await experiment(request, name);
    const lab = api(request);
    await lab.put(`/experiments/${created.id}/ready`);
    const run = await (await lab.post(`/experiments/${created.id}/runs`)).json();
    await expect.poll(async () => (await (await lab.get(`/experiments/${created.id}/runs/${run.id}`)).json()).status, { timeout: 20_000 }).toBe("completed");
    await lab.post(`/experiments/${created.id}/share`, { userEmail: env.USER2.email, permissions: { write: false, execute: false } });

    await page.goto("");
    await showInList(page, name);
    await page.getByRole("cell", { name, exact: true }).click();

    // On the scenario
    await page.getByLabel("Comment on scenario Car").fill("Should we add GPS forced on?");
    await page.getByLabel("Comments on scenario Car").getByRole("button", { name: "Comment" }).click();
    await expect(page.getByLabel("Comments on scenario Car")).toContainText("Should we add GPS forced on?");

    // On the run, and on one metric of its result
    await page.getByRole("button", { name: "Details of run 1" }).click();
    await page.getByLabel("Comment on run 1").fill("Baseline run");
    await page.getByLabel("Comments on run 1").getByRole("button", { name: "Comment" }).click();
    await page.getByLabel("Metric annotated").selectOption({ label: "Number of products" });
    const annotationTitle = "Car · z3 · Number of products";
    await page.getByLabel(`Comment on ${annotationTitle}`).fill("Matches the paper");
    await page.getByLabel(`Comments on ${annotationTitle}`).getByRole("button", { name: "Comment" }).click();
    await expect(page.getByLabel(`Comments on ${annotationTitle}`)).toContainText("Matches the paper");

    // Eli, read only, sees everything in the discussion and replies
    await secondPage.goto("");
    await secondPage.getByRole("tab", { name: "Shared with me" }).click();
    await showInList(secondPage, name);
    await secondPage.getByRole("cell", { name, exact: true }).click();
    const others = secondPage.getByRole("list", { name: "Comments on scenarios, runs and results" });
    await expect(others).toContainText("Should we add GPS forced on?");
    await expect(others).toContainText("Scenario Car");
    await expect(others).toContainText("Run 1 · Car · z3 · Number of products");
    await secondPage.getByLabel("Comment on scenario Car").fill("Yes, as a second scenario");
    await secondPage.getByLabel("Comments on scenario Car").getByRole("button", { name: "Comment" }).click();

    // Dana sees the answer without reloading
    await expect(page.getByLabel("Comments on scenario Car")).toContainText("Yes, as a second scenario", { timeout: 10_000 });
    await expect(page.getByLabel("Comments on scenario Car").getByLabel(`Comment by ${env.USER2.name}`)).toBeVisible();
  });
});

test.describe("LAB-COL-04 filters", () => {
  test("researcher, status and type filters narrow the list", async ({ page, request }) => {
    const ready = unique("Filter ready");
    const draft = unique("Filter draft");
    const readyExperiment = await experiment(request, ready);
    await experiment(request, draft);
    await api(request).put(`/experiments/${readyExperiment.id}/ready`);

    await page.goto("");
    await page.getByRole("button", { name: "Filters" }).click();
    const filters = page.getByRole("form", { name: "Filters" });
    await filters.getByLabel("Status").selectOption("ready");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("row", { name: new RegExp(ready) })).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(draft) })).toHaveCount(0);

    await filters.getByLabel("Status").selectOption("");
    await filters.getByLabel("Researcher").fill("nobody-matches");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("No results available")).toBeVisible();

    await filters.getByLabel("Researcher").fill("Dana");
    await filters.getByLabel("Type").selectOption("template");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("row", { name: new RegExp(ready) })).toHaveCount(0);
  });
});
