import fs from "fs";
import { APIRequestContext, Page } from "@playwright/test";
import { test, expect, env, showInList } from "../support/fixtures";

// P3 on the mock Reasoning gateway (each solver job takes 3 s, playwright.config.ts)
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

const minizinc = { version: "2.8.5", timeOut: 60, randomSeed: 42, mode: "satisfiability", variableSelection: "default", valueSelection: "default" };
const z3 = { version: "4.13.0", timeOut: 30, randomSeed: 7, mode: "enumeration" };
const METRICS = ["Number of products", "Degree of variability", "Structural complexity of the model"];

/** A Ready experiment with one scenario run by two solvers, and the given number of finished runs. */
async function experimentWithRuns(request: APIRequestContext, runs: number) {
  const lab = api(request);
  const catalog = await (await lab.get("/metrics/public")).json();
  const name = unique("Results");
  const created = await (await lab.post("/experiments", {
    name,
    projectId: env.MODEL.projectId,
    metrics: METRICS.map((metric) => catalog.find((m: any) => m.name === metric).id),
    scenarios: [{ name: "Car", modelIds: [env.MODEL.id], solverConfigs: { minizinc, z3 } }],
  })).json();
  expect((await lab.put(`/experiments/${created.id}/ready`)).status()).toBe(200);
  for (let i = 0; i < runs; i++) {
    const run = await (await lab.post(`/experiments/${created.id}/runs`)).json();
    await expect.poll(async () => (await (await lab.get(`/experiments/${created.id}/runs/${run.id}`)).json()).status, { timeout: 20_000 }).toBe("completed");
  }
  return { id: created.id as string, name };
}

async function open(page: Page, name: string) {
  await page.goto("");
  await showInList(page, name);
  await page.getByRole("cell", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Results", exact: true })).toBeVisible();
}

test.describe("LAB-VIS-01 dashboard", () => {
  test("follows the run as it happens, then shows the full summary", async ({ page, request }) => {
    const experiment = await experimentWithRuns(request, 0);
    await open(page, experiment.name);
    await page.getByRole("button", { name: "Dashboard" }).click();
    const dashboard = page.getByLabel("Run dashboard");

    await page.getByRole("button", { name: "Run Experiment" }).click();

    // While the first solver runs: progress moves, no metric yet
    await expect(dashboard).toContainText("0 of 2 scenario runs ended");
    const firstBar = dashboard.getByRole("progressbar", { name: "Progress of Car with minizinc" });
    await expect.poll(async () => Number(await firstBar.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    expect(Number(await firstBar.getAttribute("aria-valuenow"))).toBeLessThan(100);
    await expect(dashboard).toContainText("Metrics appear as each scenario run ends.");

    // The first scenario run ends: its metrics appear while the second runs
    await expect(dashboard).toContainText("1 of 2 scenario runs ended", { timeout: 10_000 });
    await expect(dashboard).toContainText("Metrics computed so far (1 of 2 scenario runs)");

    // The end: everything
    await expect(dashboard).toContainText("2 of 2 scenario runs ended", { timeout: 10_000 });
    const summary = dashboard.getByRole("table", { name: "Metrics computed so far" });
    await expect(summary.getByRole("columnheader")).toHaveText(["Metric", "Car · minizinc", "Car · z3"]);

    // The values shown are those stored
    const [run] = await (await api(request).get(`/experiments/${experiment.id}/runs`)).json();
    const complexity = run.provenance.metrics.find((m: any) => m.name === "Structural complexity of the model");
    const value = run.scenarioRuns[0].metrics.find((m: any) => m.metricId === complexity.id).value;
    // Car -> GPS: 1 edge, 2 nodes
    expect(value).toBe(1);
    await expect(summary.getByRole("row", { name: /Structural complexity/ })).toContainText(String(value));
  });
});

test.describe("LAB-MT-04, LAB-CF-03, LAB-VIS-02 comparison", () => {
  test("table and charts show the stored values; filters, tooltips and zoom work", async ({ page, request }) => {
    const experiment = await experimentWithRuns(request, 2);
    const results = await (await api(request).get(`/experiments/${experiment.id}/results`)).json();
    await open(page, experiment.name);
    await page.getByRole("tab", { name: "Compare" }).click();
    const compare = page.getByLabel("Comparison");

    // The latest run by default: one column per scenario run
    const table = compare.getByRole("table", { name: "Metric comparison" });
    await expect(table.getByRole("columnheader")).toHaveText(["Metric", "Car · minizinc", "Car · z3"]);
    const latest = results.rows.filter((r: any) => r.runNumber === 2);
    for (const metric of METRICS) {
      const value = latest.find((r: any) => r.metricName === metric && r.solverId === "z3").value;
      await expect(table.getByRole("row", { name: new RegExp(metric) })).toContainText(value.toLocaleString("en-US", { maximumFractionDigits: 3 }));
    }

    // Bars show the stored values (LAB-VIS-02 consistency), with a tooltip on hover
    const bars = compare.getByLabel("Number of products by scenario run");
    for (const solver of ["minizinc", "z3"]) {
      const value = latest.find((r: any) => r.metricName === "Number of products" && r.solverId === solver).value;
      await expect(bars.getByRole("listitem", { name: `Car · ${solver}: ${value} products` })).toBeVisible();
    }
    await bars.getByRole("listitem").first().hover();
    await expect(bars.getByRole("tooltip")).toContainText("Number of products:");

    // Filter: a metric left out disappears from the table and the charts
    await compare.getByRole("checkbox", { name: "Degree of variability", exact: true }).uncheck();
    await expect(table.getByRole("row", { name: /Degree of variability/ })).toHaveCount(0);
    await expect(compare.getByLabel("Degree of variability by scenario run")).toHaveCount(0);

    // Scatter plot: zoom in and back
    await compare.getByLabel("X", { exact: true }).selectOption({ label: "Number of products" });
    await compare.getByLabel("Y", { exact: true }).selectOption({ label: "Structural complexity of the model" });
    const scatter = compare.getByLabel("Structural complexity of the model against Number of products");
    await expect(scatter).toContainText("zoom ×1");
    const markers = scatter.locator("circle.lab-marker");
    const all = await markers.count();
    expect(all).toBeGreaterThan(0);
    // Zooming in keeps the points in view: here they all sit at one end of the axis
    await scatter.getByRole("button", { name: "Zoom in" }).click();
    await expect(scatter).toContainText(`zoom ×2 · ${all} of ${all} points shown`);
    await expect(markers).toHaveCount(all);
    await scatter.getByRole("button", { name: "Reset" }).click();
    await expect(scatter).toContainText("zoom ×1");

    // Heatmap, with a tooltip
    const heatmap = compare.getByRole("table", { name: "Heatmap of the metrics" });
    await heatmap.getByRole("row", { name: /Number of products/ }).getByRole("cell").first().hover();
    await expect(heatmap.getByRole("tooltip")).toContainText("Number of products:");

    // Both runs: one column per run, and lines across runs (LAB-MT-04 between executions)
    await compare.getByLabel("Run 1 (completed)").check();
    await expect(table.getByRole("columnheader")).toHaveText(["Metric", "Car · minizinc · run 1", "Car · z3 · run 1", "Car · minizinc · run 2", "Car · z3 · run 2"]);
    const line = compare.getByLabel("Number of products across runs");
    await line.getByTestId("line-chart-hit-area").hover();
    await expect(line.getByRole("tooltip")).toContainText(/Run [12]/);
  });
});

test.describe("LAB-CF-03 several scenarios", () => {
  test("two scenarios with different contexts run independently and are compared", async ({ page, request }) => {
    const lab = api(request);
    const catalog = await (await lab.get("/metrics/public")).json();
    const name = unique("Scenarios");
    const created = await (await lab.post("/experiments", {
      name,
      projectId: env.MODEL.projectId,
      metrics: ["Cardinality of the configuration space", "Structural complexity of the model"].map((metric) => catalog.find((m: any) => m.name === metric).id),
      scenarios: [
        { name: "Free", modelIds: [env.MODEL.id], solverConfigs: { minizinc } },
        { name: "GPS forced", modelIds: [env.MODEL.id], solverConfigs: { minizinc }, operationalContext: { activeFeatures: ["GPS"], inactiveFeatures: [], extraConstraints: "" } },
      ],
    })).json();
    expect((await lab.put(`/experiments/${created.id}/ready`)).status()).toBe(200);

    // Run from the interface
    await open(page, name);
    await page.getByRole("button", { name: "Run Experiment" }).click();
    await expect(page.locator(".ajs-message", { hasText: "Run #1 completed" })).toBeVisible({ timeout: 20_000 });

    const [run] = await (await lab.get(`/experiments/${created.id}/runs`)).json();
    // Each scenario its own job, with its own context
    expect(run.scenarioRuns.map((s: any) => [s.scenarioName, s.status])).toEqual([["Free", "completed"], ["GPS forced", "completed"]]);
    expect(new Set(run.scenarioRuns.map((s: any) => s.jobId)).size).toBe(2);
    expect(run.provenance.scenarios.map((s: any) => s.operationalContext?.activeFeatures ?? [])).toEqual([[], ["GPS"]]);

    // Compared side by side, each with its own stored value
    await page.getByRole("tab", { name: "Compare" }).click();
    const table = page.getByLabel("Comparison").getByRole("table", { name: "Metric comparison" });
    await expect(table.getByRole("columnheader")).toHaveText(["Metric", "Free · minizinc", "GPS forced · minizinc"]);
    const space = run.provenance.metrics.find((m: any) => m.name === "Cardinality of the configuration space").id;
    const values = run.scenarioRuns.map((s: any) => s.metrics.find((m: any) => m.metricId === space).value);
    await expect(table.getByRole("row", { name: /Cardinality/ }).getByRole("cell")).toHaveText(values.map((v: number) => `${v} configurations *`));
  });
});

test.describe("LAB-MT-05 export", () => {
  test("CSV, JSON and XLSX files hold every result of the runs", async ({ page, request }) => {
    const experiment = await experimentWithRuns(request, 1);
    const rows = (await (await api(request).get(`/experiments/${experiment.id}/results`)).json()).rows;
    await open(page, experiment.name);

    const save = async (format: string) => {
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: format, exact: true }).click()]);
      return { name: download.suggestedFilename(), body: fs.readFileSync((await download.path())!) };
    };

    const csv = await save("CSV");
    expect(csv.name).toMatch(/-results\.csv$/);
    const lines = csv.body.toString("utf8").trimEnd().split("\r\n");
    expect(lines).toHaveLength(1 + rows.length);
    expect(lines[0]).toContain("metricName");

    const json = JSON.parse((await save("JSON")).body.toString("utf8"));
    expect(json.runs).toHaveLength(1);
    expect(json.runs[0].scenarioRuns.flatMap((s: any) => s.metrics)).toHaveLength(rows.length);

    const xlsx = await save("XLSX");
    expect(xlsx.name).toMatch(/\.xlsx$/);
    expect(xlsx.body.subarray(0, 2).toString()).toBe("PK");
  });
});

test.describe("LAB-MT-06 solver benchmark", () => {
  test("each solver with its runs, success rate and response time", async ({ page, request }) => {
    const experiment = await experimentWithRuns(request, 1);
    const solvers = await (await api(request).get(`/experiments/${experiment.id}/benchmark`)).json();
    await open(page, experiment.name);
    await page.getByRole("tab", { name: "Solver benchmark" }).click();

    const table = page.getByRole("table", { name: "Solvers" });
    await expect(table.getByRole("row")).toHaveCount(3);
    for (const solver of solvers) {
      const row = table.getByRole("row", { name: new RegExp(solver.solverId) });
      await expect(row).toContainText("100 %");
      await expect(row).toContainText("1 (1 completed, 0 failed)");
    }
    await expect(page.getByLabel("Mean response time by scenario run")).toBeVisible();
  });
});
