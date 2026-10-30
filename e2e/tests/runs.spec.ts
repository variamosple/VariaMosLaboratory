import fs from "fs";
import { APIRequestContext, Page } from "@playwright/test";
import { test, expect, env, showInList } from "../support/fixtures";

// P2 on the mock Reasoning gateway: each solver job takes 3 s (playwright.config.ts)
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

/** The notification shown at the end of a run (alertify). */
const notification = (page: Page, text: string) => page.locator(".ajs-message", { hasText: text });

/** The "State" line of the experiment details. */
const experimentState = (page: Page) => page.locator(".experiment-card div", { hasText: "State :" }).last();

/** A Ready experiment made through the API, opened in the interface. */
async function openReadyExperiment(page: Page, request: APIRequestContext, operationalContext?: object) {
  const lab = api(request);
  const name = unique("Run flow");
  const metrics = await (await lab.get("/metrics/public")).json();
  const metric = metrics.find((m: any) => m.name === "Degree of variability");
  const created = await (await lab.post("/experiments", {
    name,
    projectId: env.MODEL.projectId,
    metrics: [metric.id],
    scenarios: [{ name: "MiniZinc on the car", modelIds: [env.MODEL.id], solverConfigs: { minizinc }, operationalContext }],
  })).json();
  expect((await lab.put(`/experiments/${created.id}/ready`)).status()).toBe(200);

  await page.goto("");
  await showInList(page, name);
  await page.getByRole("cell", { name, exact: true }).click();
  await expect(page.getByRole("button", { name: "Run Experiment" })).toBeEnabled();
  return { id: created.id as string, name };
}

test.describe("LAB-RUN-01, LAB-RUN-03 run an experiment and follow it", () => {
  test("one click runs a Ready experiment in the background, to its results", async ({ page, request }) => {
    const experiment = await openReadyExperiment(page, request, { activeFeatures: ["GPS"], inactiveFeatures: [], extraConstraints: "" });

    await page.getByRole("button", { name: "Run Experiment" }).click();

    // Followed while it runs
    await expect(page.getByRole("status").filter({ hasText: "Run #1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel Run" })).toBeVisible();
    const runs = page.getByRole("table", { name: "Runs" });
    await expect(runs.getByRole("row").nth(1)).toContainText(/pending|running/);

    // The end is notified on the page, the experiment is Completed
    await expect(notification(page, "Run #1 completed")).toBeVisible({ timeout: 15_000 });
    await expect(runs.getByRole("row").nth(1)).toContainText("completed");
    await expect(experimentState(page)).toContainText("COMPLETED");
    await expect(page.getByRole("button", { name: "Run Experiment" })).toBeEnabled();

    // Results and provenance
    await page.getByRole("button", { name: "Details of run 1" }).click();
    const scenarioRuns = page.getByRole("table", { name: "Scenario runs of run 1" });
    await expect(scenarioRuns).toContainText("MiniZinc on the car");
    await expect(scenarioRuns).toContainText("minizinc 2.8.5");
    // The mock's answer, shown as returned: it only tells that the context reached the Reasoning module
    await expect(scenarioRuns).toContainText("2 configurations");
    await expect(scenarioRuns).toContainText("simulated");
    await expect(page.getByText("Provenance")).toBeVisible();
    await expect(page.getByText(/timeOut = 60, randomSeed = 42/)).toBeVisible();

    const [run] = await (await api(request).get(`/experiments/${experiment.id}/runs`)).json();
    await expect(page.locator(`code[title="${run.provenance.scenarios[0].models[0].hash}"]`)).toBeVisible();
  });

  test("a Draft cannot run from the interface", async ({ page, request }) => {
    const name = unique("Draft only");
    await api(request).post("/experiments", { name, projectId: env.MODEL.projectId });

    await page.goto("");
    await showInList(page, name);
    await page.getByRole("cell", { name, exact: true }).click();

    await expect(page.getByRole("button", { name: "Run Experiment" })).toBeDisabled();
    await expect(page.getByText("Mark the experiment Ready to run it.")).toBeVisible();
  });
});

test.describe("LAB-RUN-01 the whole flow in the interface", () => {
  test("create, set the context, mark Ready, run: everything through the interface", async ({ page, request }) => {
    const name = unique("Interface only");
    await page.goto("");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("textbox", { name: "Name of the experiment" }).fill(name);
    await page.getByRole("combobox", { name: "Project" }).selectOption({ label: env.PROJECTS[0].name });

    // Mark as Ready lists what is missing (no metric yet)
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("GPS forced on");
    await page.getByRole("button", { name: "Select models" }).click();
    const models = page.getByRole("dialog");
    await models.getByText(env.PROJECTS[0].name).click();
    await models.getByText("Product line", { exact: true }).click();
    await models.getByText("Domain Engineering").click();
    await models.getByRole("checkbox", { name: env.MODEL.name }).check();
    await models.getByRole("button", { name: "Apply (1)" }).click();
    await page.getByRole("checkbox", { name: "MiniZinc (Gecode)" }).check();

    // LAB-CF-04: the features offered come from the selected model
    await page.getByRole("combobox", { name: "Active features", exact: true }).click();
    await page.getByRole("option", { name: "GPS" }).click();

    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("button", { name: "Mark as Ready" }).click();
    await expect(page.getByText("The experiment cannot run yet:")).toBeVisible();
    await expect(page.getByText("Select at least one metric.")).toBeVisible();

    // Add the metric, then Ready and Run
    await page.getByRole("button", { name: "Edit Experiment" }).click();
    await page.getByRole("button", { name: "Select metrics" }).click();
    const metrics = page.getByRole("dialog");
    await metrics.getByRole("heading", { name: "Degree of variability" }).click();
    await metrics.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await page.getByRole("button", { name: "Mark as Ready" }).click();
    await expect(experimentState(page)).toContainText("READY");

    await page.getByRole("button", { name: "Run Experiment" }).click();
    await expect(notification(page, "Run #1 completed")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Details of run 1" }).click();

    // What the Laboratory recorded and sent: the context chosen in the form
    await expect(page.getByText("Context: active [GPS], inactive []")).toBeVisible();
    const list = await (await api(request).get(`/experiments?name=${encodeURIComponent(name)}&pageNumber=1&pageSize=5`)).json();
    const [run] = await (await api(request).get(`/experiments/${list.data[0].id}/runs`)).json();
    expect(run.status).toBe("completed");
    expect(run.provenance.scenarios[0].operationalContext).toMatchObject({ activeFeatures: ["GPS"], inactiveFeatures: [] });
  });
});

test.describe("LAB-RUN-04 cancel a run", () => {
  test("cancelling from the interface stops the run, with who and when", async ({ page, request }) => {
    const experiment = await openReadyExperiment(page, request);

    await page.getByRole("button", { name: "Run Experiment" }).click();
    const cancel = page.getByRole("button", { name: "Cancel Run" });
    await expect(cancel).toBeVisible();

    const before = Date.now();
    await cancel.click();
    await expect(notification(page, "Run #1 cancelled")).toBeVisible();
    expect(Date.now() - before).toBeLessThan(5000);

    await expect(page.getByRole("table", { name: "Runs" }).getByRole("row").nth(1)).toContainText("cancelled");
    await expect(experimentState(page)).toContainText("CANCELLED");
    await page.getByRole("button", { name: "Details of run 1" }).click();
    await expect(page.getByText(`Cancelled by ${env.USER.name} on`)).toBeVisible();

    const [run] = await (await api(request).get(`/experiments/${experiment.id}/runs`)).json();
    expect(run).toMatchObject({ status: "cancelled", cancelledBy: env.USER.id, cancelledByName: env.USER.name });
    expect(run.cancelledAt).not.toBeNull();
  });
});
