import fs from "fs";
import { APIRequestContext, Page } from "@playwright/test";
import { test, expect, env, showInList } from "../support/fixtures";

// P4 on the mock Reasoning gateway (each solver job takes 3 s, playwright.config.ts)
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

const z3 = { version: "4.13.0", timeOut: 30, randomSeed: 7, mode: "enumeration" };

async function completedRun(request: APIRequestContext, name: string, solverConfigs: object = { z3 }) {
  const lab = api(request);
  const catalog = await (await lab.get("/metrics/public")).json();
  const created = await (await lab.post("/experiments", {
    name,
    projectId: env.MODEL.projectId,
    metrics: ["Number of products", "Structural complexity of the model"].map((m) => catalog.find((c: any) => c.name === m).id),
    scenarios: [{ name: "Car", modelIds: [env.MODEL.id], solverConfigs }],
  })).json();
  expect((await lab.put(`/experiments/${created.id}/ready`)).status()).toBe(200);
  const started = await (await lab.post(`/experiments/${created.id}/runs`)).json();
  await expect.poll(async () => (await (await lab.get(`/experiments/${created.id}/runs/${started.id}`)).json()).status, { timeout: 20_000 }).toBe("completed");
  return { experimentId: created.id as string, run: await (await lab.get(`/experiments/${created.id}/runs/${started.id}`)).json() };
}

async function openDetails(page: Page, name: string) {
  await page.goto("");
  await showInList(page, name);
  await page.getByRole("cell", { name, exact: true }).click();
  await page.getByRole("button", { name: "Details of run 1" }).click();
}

test.describe("LAB-RP-03, LAB-RP-01 identifier, permanent link and package", () => {
  test("the run shows its identifier, its link opens it, its package downloads", async ({ page, request }) => {
    const name = unique("Citable");
    const { run } = await completedRun(request, name);
    await openDetails(page, name);

    const box = page.getByLabel("Reproducibility of run 1");
    await expect(box).toContainText(run.persistentId);

    const [download] = await Promise.all([page.waitForEvent("download"), box.getByRole("button", { name: "Download reproducibility package" }).click()]);
    expect(download.suggestedFilename()).toBe(`${run.persistentId}.zip`);
    const zipFile = fs.readFileSync((await download.path())!);
    expect(zipFile.subarray(0, 2).toString()).toBe("PK");
    // The models and the semantics of their languages (file names are stored as is in a ZIP)
    expect(zipFile.includes("models/")).toBe(true);
    expect(zipFile.includes("semantics/")).toBe(true);

    // The permanent link, opened anew
    await page.goto(`#/runs/${run.persistentId}`);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByLabel("Reproducibility of run 1")).toContainText(run.persistentId);
  });
});

test.describe("LAB-RP-01 reproduce from a package, LAB-RP-04 compare", () => {
  test("the package rebuilds the experiment; its run is equivalent to the original", async ({ page, request }) => {
    const name = unique("Original");
    const { experimentId, run } = await completedRun(request, name);
    const packageFile = await (await request.get(`${API}/experiments/${experimentId}/runs/${run.id}/package`, {
      headers: { Authorization: `Bearer ${fs.readFileSync(env.TOKEN_FILE, "utf8").trim()}` },
    })).body();

    await page.goto("");
    await page.getByRole("button", { name: "Reproduce from a package" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel("Reproducibility package (.zip)").setInputFiles({ name: `${run.persistentId}.zip`, mimeType: "application/zip", buffer: packageFile });
    await modal.getByRole("combobox", { name: "Project" }).selectOption({ label: env.PROJECTS[1].name });
    await modal.getByRole("button", { name: "Reproduce" }).click();

    // The rebuilt experiment opens, Ready
    await expect(page.getByRole("heading", { name: `${name} (reproduction of ${run.persistentId})` })).toBeVisible();
    await expect(page.locator(".experiment-card div", { hasText: "State :" }).last()).toContainText("READY");

    await page.getByRole("button", { name: "Run Experiment" }).click();
    await expect(page.locator(".ajs-message", { hasText: "Run #1 completed" })).toBeVisible({ timeout: 20_000 });

    // Side by side with the original, added by its persistent id
    await page.getByRole("tab", { name: "Runs side by side" }).click();
    const side = page.getByLabel("Runs side by side");
    await side.getByLabel("Run 1 (completed)").check();
    await side.getByLabel("Run of another experiment").fill(run.persistentId);
    await side.getByRole("button", { name: "Add" }).click();

    await expect(side.getByText("Equivalent results: the runs give the same results, timings apart.")).toBeVisible();
    await expect(side.getByText("Setup (0 differences)")).toBeVisible();
    // Only timings differ in the results
    const differing = side.getByRole("table", { name: "Results side by side" }).getByRole("row", { name: /^Differs:/ });
    for (const label of await differing.evaluateAll((rows) => rows.map((r) => r.getAttribute("aria-label")))) {
      expect(label).toMatch(/reasoningTimeMs/);
    }
  });

  test("two different experiments: differences highlighted, metrics charted across them (LAB-VIS-02)", async ({ page, request }) => {
    const firstName = unique("Thirty seconds");
    const secondName = unique("Ninety seconds");
    const first = await completedRun(request, firstName);
    const second = await completedRun(request, secondName, { z3: { ...z3, timeOut: 90 } });

    await openDetails(page, secondName);
    await page.getByRole("tab", { name: "Runs side by side" }).click();
    const side = page.getByLabel("Runs side by side");
    await side.getByLabel("Run 1 (completed)").check();
    await side.getByLabel("Run of another experiment").fill(first.run.persistentId);
    await side.getByRole("button", { name: "Add" }).click();

    const setup = side.getByRole("table", { name: "Setup side by side" });
    const timeOut = setup.getByRole("row", { name: "Differs: scenarios/Car/solvers/z3/parameters/timeOut" });
    await expect(timeOut).toHaveClass(/table-warning/);
    await expect(timeOut.getByRole("cell")).toHaveText(["90", "30"]);
    // The answer echoes the parameters: the results are not the same
    await expect(side.getByText(/^The results differ/)).toBeVisible();
    await expect(side.getByRole("table", { name: "Results side by side" }).getByRole("row", { name: "Differs: Car/z3/result/parameters/timeOut" })).toBeVisible();

    // One chart per metric, with a bar per run of each experiment
    const products = side.getByLabel("Number of products by scenario run");
    await expect(products.getByRole("listitem")).toHaveCount(2);
    await expect(products).toContainText(firstName);
    await expect(products).toContainText(secondName);
    expect(second.run.scenarioRuns[0].metrics).toHaveLength(2);
  });
});
