import fs from "fs";
import { APIRequestContext } from "@playwright/test";
import { test, expect, env } from "../support/fixtures";

const API = `http://127.0.0.1:${env.BACKEND_PORT}`;
const CARS = env.PROJECTS[0];
const ROBOTS = env.PROJECTS[1];

const unique = (name: string) => `${name} ${Date.now().toString(36)}`;

/** The Laboratory backend, called with the session token of the run. */
const api = (request: APIRequestContext) => {
  const headers = { Authorization: `Bearer ${fs.readFileSync(env.TOKEN_FILE, "utf8").trim()}` };
  return {
    get: (url: string) => request.get(API + url, { headers }),
    post: (url: string, data?: object) => request.post(API + url, { headers, data }),
    put: (url: string, data?: object) => request.put(API + url, { headers, data }),
  };
};

const minizinc = { version: "2.8.5", timeOut: 60, randomSeed: 42, mode: "satisfiability", variableSelection: "default", valueSelection: "default" };

test.describe("LAB-EX-01 create an experiment", () => {
  test("the creation flow with all the fields", async ({ page, request }) => {
    const name = unique("GPS reasoning time");

    await page.goto("");
    await page.getByRole("button", { name: "Create Experiment" }).click();

    await page.getByRole("textbox", { name: "Name of the experiment" }).fill(name);
    await page.getByRole("combobox", { name: "Project" }).selectOption({ label: CARS.name });
    await page.getByRole("textbox", { name: "Description of the experiment" }).fill("Reasoning time with and without GPS");
    await page.getByRole("textbox", { name: "Hypothesis of the experiment" }).fill("MiniZinc answers in under a second");
    await page.getByRole("textbox", { name: "Ex: biology, chemistry, physics" }).fill("cars, gps");

    await page.getByRole("button", { name: "Select metrics" }).click();
    const metrics = page.getByRole("dialog");
    await metrics.getByRole("heading", { name: "Degree of variability" }).click();
    await metrics.getByRole("button", { name: "Apply" }).click();
    await expect(metrics).toBeHidden();

    await page.getByRole("textbox", { name: "Name", exact: true }).fill("MiniZinc on the car model");
    await page.getByRole("button", { name: "Select models" }).click();
    const models = page.getByRole("dialog");
    await models.getByText(CARS.name).click();
    await models.getByText("Product line", { exact: true }).click();
    await models.getByText("Domain Engineering").click();
    await models.getByRole("checkbox", { name: env.MODEL.name }).check();
    await models.getByRole("button", { name: "Apply (1)" }).click();
    await expect(models).toBeHidden();

    await page.getByRole("checkbox", { name: "MiniZinc (Gecode)" }).check();

    const created = page.waitForResponse((response) => response.url() === `${API}/experiments` && response.request().method() === "POST");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    const { id } = await response.json();

    // The experiment page
    await expect(page.getByText(name).first()).toBeVisible();
    await expect(page.getByText(CARS.name)).toBeVisible();

    // Everything entered is stored by the backend
    const detailed = await (await api(request).get(`/experiments/${id}/detailed`)).json();
    expect(detailed).toMatchObject({
      name,
      status: "draft",
      projectId: CARS.id,
      description: "Reasoning time with and without GPS",
      hypothesis: "MiniZinc answers in under a second",
      labels: ["cars", "gps"],
      userRole: "owner",
      author: env.USER.name,
    });
    expect(detailed.metrics.map((metric: any) => metric.name)).toEqual(["Degree of variability"]);
    expect(detailed.scenarios).toHaveLength(1);
    expect(detailed.scenarios[0].name).toBe("MiniZinc on the car model");
    expect(detailed.scenarios[0].models.map((model: any) => model.modelId)).toEqual([env.MODEL.id]);
    expect(Object.keys(detailed.scenarios[0].solverConfigs)).toEqual(["minizinc"]);

    // It appears, as a Draft, in the list of its project only
    await page.goto("");
    const filter = page.getByRole("combobox", { name: "Project" });
    await filter.selectOption({ label: CARS.name });
    await expect(page.getByRole("row", { name: new RegExp(name) })).toContainText("draft");
    await filter.selectOption({ label: ROBOTS.name });
    await expect(page.getByRole("row", { name: new RegExp(name) })).toHaveCount(0);
  });

  test("each scenario keeps its own solvers, even when the label is clicked", async ({ page, request }) => {
    const name = unique("Two scenarios");
    await page.goto("");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("textbox", { name: "Name of the experiment" }).fill(name);
    await page.getByRole("combobox", { name: "Project" }).selectOption({ label: CARS.name });
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("First");
    const pane = page.locator(".tab-pane.active");
    await pane.getByText("MiniZinc (Gecode)", { exact: true }).click();
    await page.getByRole("button", { name: "+ add scenario" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Second");
    // A click on the text, as a user does: it must tick this scenario's box
    await pane.getByText("Microsoft Z3", { exact: true }).click();
    await expect(pane.getByRole("checkbox", { name: "Microsoft Z3" })).toBeChecked();

    const created = page.waitForResponse((response) => response.url() === `${API}/experiments` && response.request().method() === "POST");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    const { id } = await (await created).json();
    const detailed = await (await api(request).get(`/experiments/${id}/detailed`)).json();
    expect(detailed.scenarios.map((s: any) => [s.name, Object.keys(s.solverConfigs)])).toEqual([["First", ["minizinc"]], ["Second", ["z3"]]]);
  });

  test("a metric created in the dialog is selected once and saved with the experiment (LAB-MT-02)", async ({ page, request }) => {
    const metric = unique("Share of free features");
    const name = unique("Custom metric");
    await page.goto("");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("textbox", { name: "Name of the experiment" }).fill(name);
    await page.getByRole("combobox", { name: "Project" }).selectOption({ label: CARS.name });
    await page.getByRole("button", { name: "Select metrics" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("heading", { name: "Number of products", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Apply (1)" })).toBeVisible();
    await dialog.getByRole("tab", { name: "Create Metric" }).click();
    await dialog.getByPlaceholder("e.g. Error Rate").fill(metric);
    await dialog.getByPlaceholder("e.g. (errors / total) * 100").fill("free / features");
    await dialog.getByPlaceholder("%").fill("ratio");
    await dialog.getByPlaceholder("Write your script here...").fill("return free / features;");
    await dialog.getByRole("button", { name: "Create Metric" }).click();

    await expect(dialog.getByRole("heading", { name: metric })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Apply (2)" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Publish Selected Custom Metrics (1)" })).toBeVisible();
    await dialog.getByRole("button", { name: "Apply (2)" }).click();

    // The server names the metric's id: the experiment must reference that one
    const created = page.waitForResponse((response) => response.url() === `${API}/experiments` && response.request().method() === "POST");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    const detailed = await (await api(request).get(`/experiments/${(await response.json()).id}/detailed`)).json();
    expect(detailed.metrics.map((m: any) => m.name).sort()).toEqual(["Number of products", metric].sort());
  });

  test("an experiment cannot be created without a project", async ({ page }) => {
    let posted = false;
    page.on("request", (request) => {
      if (request.url() === `${API}/experiments` && request.method() === "POST") posted = true;
    });

    await page.goto("");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("textbox", { name: "Name of the experiment" }).fill(unique("No project"));
    await page.getByRole("button", { name: "Create Experiment" }).click();

    await expect(page.getByText("The experiment must belong to a project.")).toBeVisible();
    expect(posted).toBe(false);
  });
});

test.describe("experiment list", () => {
  test("every action button of a row is fully visible", async ({ page, request }) => {
    const name = unique("Actions");
    await api(request).post("/experiments", { name, projectId: CARS.id });
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("");
    const row = page.getByRole("row", { name: new RegExp(name) });
    // The table scrolls inside its container: a button past the container's edge is cut off
    const container = (await page.locator(".table-responsive").first().boundingBox())!;
    const cell = (await row.getByRole("cell").last().boundingBox())!;
    for (const name of ["Copy experiment", "Share experiment", "Archive experiment", "Delete experiment"]) {
      const box = (await row.getByRole("button", { name }).boundingBox())!;
      expect(box.x + box.width, `${name} ends inside its cell`).toBeLessThanOrEqual(cell.x + cell.width);
      expect(box.x + box.width, `${name} ends inside the table container`).toBeLessThanOrEqual(container.x + container.width);
    }
  });
});

test.describe("LAB-EX-06 archive and restore", () => {
  test("a Ready experiment is archived, shown in the archive, and restored as Ready", async ({ page, request }) => {
    const lab = api(request);
    const name = unique("Archive cycle");
    const catalog = await (await lab.get("/metrics/public")).json();
    const metric = (catalog.data ?? catalog).find((m: any) => m.name === "Degree of variability");

    const created = await lab.post("/experiments", {
      name,
      projectId: CARS.id,
      metrics: [metric.id],
      scenarios: [{ name: "MiniZinc", modelIds: [env.MODEL.id], solverConfigs: { minizinc } }],
    });
    expect(created.status()).toBe(201);
    const { id } = await created.json();
    expect((await lab.put(`/experiments/${id}/ready`)).status()).toBe(200);

    await page.goto("");
    const row = page.getByRole("row", { name: new RegExp(name) });
    await expect(row).toContainText("ready");
    await row.getByRole("button", { name: "Archive experiment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Accept" }).click();
    await expect(row).toHaveCount(0);

    await page.getByRole("button", { name: "Archived" }).click();
    const archive = page.getByRole("dialog");
    const archivedRow = archive.getByRole("row", { name: new RegExp(name) });
    await expect(archivedRow).toContainText("archived");
    await archivedRow.getByRole("button", { name: "Restore experiment" }).click();
    await page.getByRole("dialog").filter({ hasText: "restore" }).getByRole("button", { name: "Accept" }).click();

    await expect(page.getByRole("row", { name: new RegExp(name) })).toContainText("ready");
    expect((await (await lab.get(`/experiments/${id}/detailed`)).json()).status).toBe("ready");
  });
});

test.describe("LAB-EX-02 clone an experiment", () => {
  test("the copy is a Draft in the same project that records its origin", async ({ page, request }) => {
    const lab = api(request);
    const name = unique("To clone");
    const { id } = await (await lab.post("/experiments", { name, projectId: ROBOTS.id })).json();

    await page.goto("");
    await page.getByRole("row", { name: new RegExp(name) }).getByRole("button", { name: "Copy experiment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Accept" }).click();

    const copyRow = page.getByRole("row", { name: new RegExp(`${name} \\(copy\\)`) });
    await expect(copyRow).toContainText("draft");
    await expect(copyRow).toContainText(`Copy of “${name}” (version 1)`);

    const list = await (await lab.get(`/experiments?name=${encodeURIComponent(name + " (copy)")}&pageNumber=1&pageSize=5`)).json();
    const copy = await (await lab.get(`/experiments/${list.data[0].id}/detailed`)).json();
    expect(copy).toMatchObject({ status: "draft", projectId: ROBOTS.id, clonedFrom: { experimentId: id, version: 1 } });
  });
});
