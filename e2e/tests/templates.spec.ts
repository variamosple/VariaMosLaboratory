import fs from "fs";
import { APIRequestContext, Page } from "@playwright/test";
import { test, expect, env } from "../support/fixtures";

const API = `http://127.0.0.1:${env.BACKEND_PORT}`;
const CARS = env.PROJECTS[0];
const ROBOTS = env.PROJECTS[1];
const CONTEXT_COMPARISON = "7e3a1000-0000-4000-8000-000000000004";

const unique = (name: string) => `${name} ${Date.now().toString(36)}`;

/** The Laboratory backend, called with the session token of the run. */
const api = (request: APIRequestContext) => {
  const headers = { Authorization: `Bearer ${fs.readFileSync(env.TOKEN_FILE, "utf8").trim()}` };
  return {
    get: (url: string) => request.get(API + url, { headers }),
    post: (url: string, data?: object) => request.post(API + url, { headers, data }),
  };
};

/** Opens the creation form for a project and applies the template of that name. */
async function applyTemplate(page: Page, projectName: string, templateName: string) {
  await page.goto("");
  await page.getByRole("button", { name: "Create Experiment" }).click();
  await page.getByRole("combobox", { name: "Project" }).selectOption({ label: projectName });
  await page.getByRole("button", { name: "Import Template" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox", { name: "Search templates" }).fill(templateName);
  await modal.getByRole("cell", { name: new RegExp(`^${templateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first().click();
  return modal;
}

/** What the form says about the applied template. */
const notice = (page: Page) => page.getByRole("status").filter({ hasText: "Configuration of the template" });

/** Creates the experiment of the form under a new name; returns the request body and the created experiment. */
async function create(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Name of the experiment" }).fill(name);
  const created = page.waitForResponse((response) => response.url() === `${API}/experiments` && response.request().method() === "POST");
  await page.getByRole("button", { name: "Create Experiment" }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  return { sent: response.request().postDataJSON(), experiment: await response.json() };
}

test.describe("LAB-CF-05 start an experiment from a template", () => {
  test("a predefined template fills the form, and the experiment records it as its origin", async ({ page, request }) => {
    const template = await (await api(request).get(`/experiments/${CONTEXT_COMPARISON}/detailed`)).json();
    const modal = await applyTemplate(page, CARS.name, "Operational context comparison");

    // What it holds, before applying it
    await modal.getByRole("button", { name: "See Template Details" }).click();
    const details = modal.getByRole("region", { name: "Template details" });
    await expect(details).toContainText("Without context: z3");
    await expect(details).toContainText("Number of products");
    await modal.getByRole("button", { name: "Apply Template" }).click();
    await expect(modal).toBeHidden();

    // The form holds the base configuration; nothing is saved yet
    await expect(page.getByRole("textbox", { name: "Name of the experiment" })).toHaveValue("Operational context comparison");
    await expect(page.getByRole("textbox", { name: "Description of the experiment" })).toHaveValue(template.description);
    await expect(page.getByRole("textbox", { name: "Hypothesis of the experiment" })).toHaveValue(template.hypothesis);
    await expect(page.getByRole("combobox", { name: "Project" })).toHaveValue(CARS.id);
    await expect(notice(page)).toContainText("Configuration of the template Operational context comparison applied");
    await expect(page.getByRole("tab", { name: "Without context" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "With context" })).toBeVisible();

    const name = unique("Context comparison on cars");
    const { sent, experiment } = await create(page, name);
    expect(sent).toMatchObject({ templateId: CONTEXT_COMPARISON, templateVersion: 1 });

    const detailed = await (await api(request).get(`/experiments/${experiment.id}/detailed`)).json();
    expect(detailed).toMatchObject({
      name,
      status: "draft",
      projectId: CARS.id,
      description: template.description,
      hypothesis: template.hypothesis,
      labels: ["operational-context"],
      clonedFrom: { experimentId: CONTEXT_COMPARISON, version: 1, name: "Operational context comparison" },
    });
    expect(detailed.scenarios.map((s: any) => s.name)).toEqual(["Without context", "With context"]);
    // The solver of the template, on the version the catalog offers
    expect(detailed.scenarios[0].solverConfigs).toEqual({ z3: { version: "4.13.0", timeOut: 60, randomSeed: 42, mode: "enumeration" } });
    expect(detailed.metrics.map((m: any) => m.id).sort()).toEqual(template.metrics.map((m: any) => m.id).sort());
    expect(detailed.scenarios.map((s: any) => s.id)).not.toContain(template.scenarios[0].id);

    // The template is unchanged
    const after = await (await api(request).get(`/experiments/${CONTEXT_COMPARISON}/detailed`)).json();
    expect(after).toMatchObject({ version: 1, name: "Operational context comparison" });
    expect(after.scenarios).toEqual(template.scenarios);
  });

  test("a researcher's template keeps its models only in its own project", async ({ page, request }) => {
    const minizinc = { version: "2.8.5", timeOut: 60, randomSeed: 42, mode: "satisfiability", variableSelection: "default", valueSelection: "default" };
    const metric = (await (await api(request).get("/metrics/public")).json())[0];
    const templateName = unique("Car template");
    const source = await (await api(request).post("/experiments", {
      name: templateName,
      projectId: CARS.id,
      metrics: [metric.id],
      scenarios: [{ name: "Car model", modelIds: [env.MODEL.id], solverConfigs: { minizinc } }],
    })).json();
    expect((await api(request).post(`/experiments/${source.id}/publish/template`)).status()).toBe(200);

    // In another project, the configuration without the model, and the form says so
    let modal = await applyTemplate(page, ROBOTS.name, templateName);
    await modal.getByRole("button", { name: "Apply Template" }).click();
    await expect(notice(page)).toContainText("Pick the input models of each scenario");
    const elsewhere = await create(page, unique("Robots from the car template"));
    expect(elsewhere.sent.scenarios[0].models).toEqual([]);
    expect(elsewhere.experiment).toMatchObject({ projectId: ROBOTS.id, clonedFrom: { experimentId: source.id } });
    expect(elsewhere.experiment.scenarios[0]).toMatchObject({ name: "Car model", models: [] });

    // In the template's project, the model too
    modal = await applyTemplate(page, CARS.name, templateName);
    await modal.getByRole("button", { name: "Apply Template" }).click();
    await expect(notice(page)).toBeVisible();
    await expect(notice(page)).not.toContainText("Pick the input models");
    const same = await create(page, unique("Cars from the car template"));
    expect(same.experiment.scenarios[0].models.map((m: any) => m.modelId)).toEqual([env.MODEL.id]);
  });
});
