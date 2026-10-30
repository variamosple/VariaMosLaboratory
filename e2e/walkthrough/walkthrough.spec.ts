import fs from "fs";
import path from "path";
import { Page } from "@playwright/test";
import { test, expect, env, showInList } from "../support/fixtures";

/**
 * Functional walkthrough of the Laboratory: two researchers use the interface
 * only, from an empty project to reproduced results. Each step is recorded,
 * with its requirement, result and screenshot; a failed step does not stop the
 * journey. Report: .work/walkthrough/report.json and the screenshots next to it.
 */
const OUT = path.join(env.WORK_DIR, "walkthrough");
const log: { n: number; requirement: string; step: string; ok: boolean; note: string; screenshot: string }[] = [];
const STAMP = Date.now().toString(36);
const NAME = `Car study ${STAMP}`;

async function step(page: Page, requirement: string, title: string, body: () => Promise<string | void>) {
  const n = log.length + 1;
  const screenshot = `${String(n).padStart(2, "0")}.png`;
  let ok = true;
  let note = "";
  try {
    note = (await body()) ?? "";
  } catch (error) {
    ok = false;
    note = String((error as Error).message ?? error).split("\n").slice(0, 3).join(" ").slice(0, 400);
    // A dialog left open would make every next step fail
    for (let i = 0; i < 3 && (await page.getByRole("dialog").count()) > 0; i++) await page.keyboard.press("Escape");
  }
  await page.screenshot({ path: path.join(OUT, screenshot), fullPage: false }).catch(() => undefined);
  log.push({ n, requirement, step: title, ok, note, screenshot });
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(log, null, 2));
}

const esc = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A metric card title may start with its code ("REQ-13 Structural complexity…").
const metricTitle = (name: string) => new RegExp(`(^|\\s)${esc(name)}$`);
const toast = (page: Page, text: string | RegExp) => page.locator(".ajs-message", { hasText: text }).last();
const state = (page: Page) => page.locator(".experiment-card div", { hasText: "State :" }).last();
// The list is sorted by name and paginated: show only this journey's experiments
const backToList = async (page: Page) => {
  await page.goto("");
  await expect(page.getByRole("button", { name: "Create Experiment" })).toBeVisible();
  await showInList(page, NAME);
};
const openExperiment = async (page: Page, name: string, tab?: string) => {
  await page.goto("");
  if (tab) await page.getByRole("tab", { name: tab }).click();
  await showInList(page, name);
  // A copy's cell also says where it comes from
  await page.getByRole("cell", { name: new RegExp(`^${esc(name)}(\\s*Copy of.*)?$`) }).first().click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
};
async function chooseModel(page: Page) {
  await page.getByRole("button", { name: "Select models" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText(env.PROJECTS[0].name).click();
  await dialog.getByText("Product line", { exact: true }).click();
  await dialog.getByText("Domain Engineering").click();
  await dialog.getByRole("checkbox", { name: env.MODEL.name }).check();
  await dialog.getByRole("button", { name: "Apply (1)" }).click();
}
async function selectMetrics(page: Page, names: string[]) {
  await page.getByRole("button", { name: "Select metrics" }).click();
  const dialog = page.getByRole("dialog");
  for (const name of names) await dialog.getByRole("heading", { name: metricTitle(name) }).click();
  await dialog.getByRole("button", { name: "Apply" }).click();
  await expect(dialog).toBeHidden();
}
async function runAndWait(page: Page, number: number) {
  await page.getByRole("button", { name: "Run Experiment" }).click();
  await expect(toast(page, `Run #${number} completed`)).toBeVisible({ timeout: 30_000 });
}

test("functional walkthrough", async ({ page, secondPage }) => {
  test.setTimeout(15 * 60_000);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1400, height: 1000 });
  await secondPage.setViewportSize({ width: 1400, height: 1000 });

  await step(page, "—", "The Laboratory opens for a signed-in researcher", async () => {
    await page.goto("");
    await expect(page.getByRole("button", { name: "Create Experiment" })).toBeVisible();
  });

  await step(page, "LAB-EX-01", "Create an experiment without metrics: two scenarios, a model, three solvers, a context", async () => {
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("textbox", { name: "Name of the experiment" }).fill(NAME);
    await page.getByRole("combobox", { name: "Project" }).selectOption({ label: env.PROJECTS[0].name });
    await page.getByRole("textbox", { name: "Description of the experiment" }).fill("Solvers on the car feature model");
    await page.getByRole("textbox", { name: "Hypothesis of the experiment" }).fill("Z3 answers as fast as MiniZinc");
    await page.getByRole("textbox", { name: "Ex: biology, chemistry, physics" }).fill("cars, solvers");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Free");
    await chooseModel(page);
    await page.getByRole("checkbox", { name: "MiniZinc (Gecode)" }).check();
    await page.getByRole("checkbox", { name: "Microsoft Z3" }).check();
    await page.getByRole("button", { name: "+ add scenario" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("GPS on");
    await chooseModel(page);
    await page.getByRole("checkbox", { name: "Microsoft Z3" }).check();
    await page.getByRole("combobox", { name: "Active features", exact: true }).click();
    await page.getByRole("option", { name: "GPS" }).click();
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await expect(page.getByRole("heading", { name: NAME, exact: true })).toBeVisible();
    await expect(state(page)).toContainText("DRAFT");
    await expect(page.getByText(env.PROJECTS[0].name).first()).toBeVisible();
  });

  await step(page, "LAB-RUN-01", "Mark as Ready lists what is missing", async () => {
    await page.getByRole("button", { name: "Mark as Ready" }).click();
    await expect(page.getByText("Select at least one metric.")).toBeVisible();
  });

  await step(page, "LAB-EX-03, LAB-MT-01", "Edit in Draft: add four predefined metrics", async () => {
    await page.getByRole("button", { name: "Edit Experiment" }).click();
    await selectMetrics(page, ["Number of products", "Cardinality of the configuration space", "Reasoning time", "Structural complexity of the model"]);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("button", { name: "Mark as Ready" })).toBeVisible();
  });

  await step(page, "LAB-MT-02", "Create a custom metric from the metric dialog", async () => {
    await page.getByRole("button", { name: "Edit Experiment" }).click();
    await page.getByRole("button", { name: "Select metrics" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Create Metric" }).click();
    await dialog.getByPlaceholder("e.g. Error Rate").fill(`Share of free features ${STAMP}`);
    await dialog.getByPlaceholder("e.g. (errors / total) * 100").fill("free / features");
    await dialog.getByPlaceholder("%").fill("ratio");
    await dialog.getByPlaceholder("Write your script here...").fill("return free / features;");
    await dialog.getByRole("button", { name: "Create Metric" }).click();
    await dialog.getByRole("tab", { name: "Custom Metrics" }).click();
    // A new metric is selected at once
    await expect(dialog.getByRole("heading", { name: metricTitle(`Share of free features ${STAMP}`) })).toBeVisible();
    await dialog.getByRole("button", { name: "Apply (5)" }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("button", { name: "Mark as Ready" })).toBeVisible();
  });

  await step(page, "LAB-EX-04", "Version history: three versions, compare the first two", async () => {
    await page.getByRole("button", { name: "Version History" }).click();
    const history = page.getByRole("dialog").filter({ hasText: "Version History" });
    await expect(history).toContainText("Updated metrics");
    await history.getByRole("checkbox", { name: "Select version 1 to compare" }).first().check();
    await history.getByRole("checkbox", { name: "Select version 2 to compare" }).first().check();
    await history.getByRole("button", { name: "Compare Versions" }).click();
    const compare = page.getByRole("dialog").last();
    await expect(compare).toContainText("Compare Versions");
    await expect(compare).toContainText("No metrics");
    await expect(compare).toContainText("Structural complexity of the model");
    await page.screenshot({ path: path.join(OUT, "05b-compare.png") });
    await compare.getByRole("button", { name: "Close" }).last().click();
    await history.getByRole("button", { name: "Close" }).last().click();
  });

  await step(page, "LAB-EX-07, LAB-CF-01, LAB-R-03, LAB-RP-01", "Mark as Ready: models pinned with the semantics of their language", async () => {
    await page.getByRole("button", { name: "Mark as Ready" }).click();
    await expect(state(page)).toContainText("READY");
    await expect(page.getByText(/pinned [0-9a-f]{8}/).first()).toBeVisible();
    await expect(page.getByText(/semantics [0-9a-f]{8}/).first()).toBeVisible();
  });

  await step(page, "LAB-RUN-01, LAB-RUN-03, LAB-VIS-01", "Run: the dashboard follows the run, then the end is notified", async () => {
    await page.getByRole("button", { name: "Run Experiment" }).click();
    const dashboard = page.getByLabel("Run dashboard");
    await expect(dashboard).toContainText("0 of 3 scenario runs ended");
    await page.screenshot({ path: path.join(OUT, "07b-running.png") });
    await expect(toast(page, "Run #1 completed")).toBeVisible({ timeout: 30_000 });
    await expect(dashboard).toContainText("3 of 3 scenario runs ended");
    await expect(state(page)).toContainText("COMPLETED");
  });

  await step(page, "LAB-MT-03", "Metrics: values, simulated marks, and reasons for those not computed", async () => {
    const summary = page.getByRole("table", { name: "Metrics computed so far" });
    await expect(summary.getByRole("row", { name: /Structural complexity/ })).toContainText("1");
    await expect(summary.getByRole("row", { name: /Share of free features/ })).toContainText("n/a");
    return "Custom metric shown n/a: “Custom metrics are not computed yet (LAB-MT-02)”";
  });

  await step(page, "LAB-RUN-01", "A second run", async () => {
    await runAndWait(page, 2);
  });

  await step(page, "LAB-MT-04, LAB-CF-03, LAB-VIS-02", "Compare two runs: table, bars, lines, scatter zoom, heatmap", async () => {
    await page.getByRole("tab", { name: "Compare" }).click();
    const compare = page.getByLabel("Comparison");
    await compare.getByLabel("Run 1 (completed)").check();
    await expect(compare.getByRole("table", { name: "Metric comparison" }).getByRole("columnheader")).toHaveCount(7);
    await compare.getByLabel("Number of products by scenario run").getByRole("listitem").first().hover();
    await expect(compare.getByLabel("Number of products by scenario run").getByRole("tooltip")).toBeVisible();
    await compare.getByLabel("Number of products across runs").getByTestId("line-chart-hit-area").hover();
    await expect(compare.getByLabel("Number of products across runs").getByRole("tooltip")).toBeVisible();
    const scatter = compare.locator(".lab-scatter");
    await scatter.getByRole("button", { name: "Zoom in" }).click();
    await expect(scatter).toContainText("zoom ×2");
    await expect(compare.getByRole("table", { name: "Heatmap of the metrics" })).toBeVisible();
    await page.locator("#results").screenshot({ path: path.join(OUT, "11b-compare.png") });
  });

  await step(page, "LAB-MT-06", "Solver benchmark", async () => {
    await page.getByRole("tab", { name: "Solver benchmark" }).click();
    const table = page.getByRole("table", { name: "Solvers" });
    await expect(table.getByRole("row", { name: /minizinc/ })).toContainText("100 %");
    await expect(table.getByRole("row", { name: /z3/ })).toContainText("4 (4 completed, 0 failed)");
  });

  await step(page, "LAB-MT-05", "Export CSV, JSON, XLSX", async () => {
    const names: string[] = [];
    for (const format of ["CSV", "JSON", "XLSX"]) {
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: format, exact: true }).click()]);
      const file = path.join(OUT, `export.${format.toLowerCase()}`);
      await download.saveAs(file);
      names.push(`${download.suggestedFilename()} (${fs.statSync(file).size} bytes)`);
    }
    const csv = fs.readFileSync(path.join(OUT, "export.csv"), "utf8").trim().split("\r\n");
    expect(csv.length).toBe(1 + 2 * 3 * 5);
    return names.join(", ");
  });

  let persistentId = "";
  await step(page, "LAB-RP-03", "The run has a persistent identifier; its permanent link opens it", async () => {
    await page.getByRole("button", { name: "Details of run 1" }).click();
    const box = page.getByLabel("Reproducibility of run 1");
    persistentId = (await box.locator("code").innerText()).trim();
    expect(persistentId).toMatch(/^VLAB-/);
    await page.goto(`#/runs/${persistentId}`);
    await expect(page.getByLabel("Reproducibility of run 1")).toContainText(persistentId);
    return persistentId;
  });

  let packagePath = "";
  await step(page, "LAB-RP-01", "Download the reproducibility package", async () => {
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download reproducibility package" }).click()]);
    packagePath = path.join(OUT, download.suggestedFilename());
    await download.saveAs(packagePath);
    expect(fs.readFileSync(packagePath).subarray(0, 2).toString()).toBe("PK");
    return `${download.suggestedFilename()}, ${fs.statSync(packagePath).size} bytes`;
  });

  const reproduction = `${NAME} (reproduction of ${persistentId})`;
  await step(page, "LAB-RP-01, LAB-NF-03", "Reproduce from the package into another project, run it", async () => {
    await backToList(page);
    await page.getByRole("button", { name: "Reproduce from a package" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel("Reproducibility package (.zip)").setInputFiles(packagePath);
    await modal.getByRole("combobox", { name: "Project" }).selectOption({ label: env.PROJECTS[1].name });
    await modal.getByRole("button", { name: "Reproduce" }).click();
    await expect(page.getByRole("heading", { name: reproduction })).toBeVisible();
    await expect(state(page)).toContainText("READY");
    await runAndWait(page, 1);
  });

  await step(page, "LAB-RP-04", "Side by side with the original: equivalent, timings apart", async () => {
    await page.getByRole("tab", { name: "Runs side by side" }).click();
    const side = page.getByLabel("Runs side by side");
    await side.getByLabel("Run 1 (completed)").check();
    await side.getByLabel("Run of another experiment").fill(persistentId);
    await side.getByRole("button", { name: "Add" }).click();
    await expect(side.getByText("Equivalent results: the runs give the same results, timings apart.")).toBeVisible();
    await expect(side.getByText("Setup (0 differences)")).toBeVisible();
    await page.locator("#results").screenshot({ path: path.join(OUT, "17b-side.png") });
  });

  await step(page, "LAB-RUN-04", "Cancel a run while it runs", async () => {
    await openExperiment(page, NAME);
    await page.getByRole("button", { name: "Run Experiment" }).click();
    await page.getByRole("button", { name: "Cancel Run" }).click();
    await expect(toast(page, "Run #3 cancelled")).toBeVisible();
    await expect(state(page)).toContainText("CANCELLED");
    await page.getByRole("button", { name: "Details of run 3" }).click();
    await expect(page.getByText(`Cancelled by ${env.USER.name}`)).toBeVisible();
  });

  await step(page, "LAB-EX-03, LAB-EX-07", "Editing after runs creates a new Draft version", async () => {
    await expect(page.getByText("Saving a change creates a new version and returns the experiment to Draft.")).toBeVisible();
    await page.getByRole("button", { name: "Edit Experiment" }).click();
    await page.getByRole("textbox", { name: "Description of the experiment" }).fill("Solvers on the car feature model, second round");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(state(page)).toContainText("DRAFT");
    await expect(page.getByRole("button", { name: "Run Experiment" })).toBeDisabled();
  });

  await step(page, "LAB-EX-02", "Clone from the list: a Draft that shows its origin", async () => {
    await backToList(page);
    await page.getByRole("row", { name: new RegExp(`^draft ${NAME} Solvers`) }).getByRole("button", { name: "Copy experiment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Accept" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`${NAME} \\(copy\\)`) })).toContainText(`Copy of “${NAME}”`);
  });

  await step(page, "LAB-COL-01", "Share with the second researcher: write and execute", async () => {
    await page.getByRole("row", { name: new RegExp(`^draft ${NAME} Solvers`) }).getByRole("button", { name: "Share experiment" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("User Email").fill(env.USER2.email);
    await dialog.getByLabel(/^Write/).check();
    await dialog.getByLabel(/^Execute/).check();
    await dialog.getByRole("button", { name: "Invite" }).click();
    await expect(toast(page, "shared successfully")).toBeVisible();
  });

  await step(secondPage, "LAB-COL-01", "The second researcher finds it under Shared with me, owner shown", async () => {
    await openExperiment(secondPage, NAME, "Shared with me");
    await expect(secondPage.getByRole("button", { name: "Edit Experiment" })).toBeVisible();
  });

  await step(page, "LAB-COL-03", "Comments: Dana on a scenario and on a result metric", async () => {
    await openExperiment(page, NAME);
    await page.getByLabel("Comment on scenario Free").fill("Should we drop MiniZinc?");
    await page.getByLabel("Comments on scenario Free").getByRole("button", { name: "Comment" }).click();
    await page.getByRole("button", { name: "Details of run 1" }).click();
    await page.getByLabel("Metric annotated").selectOption({ label: "Number of products" });
    await page.getByLabel("Comment on Free · minizinc · Number of products").fill("4 products, as expected for two features");
    await page.getByLabel("Comments on Free · minizinc · Number of products").getByRole("button", { name: "Comment" }).click();
    await expect(page.getByLabel("Comments on Free · minizinc · Number of products")).toContainText("as expected");
  });

  await step(secondPage, "LAB-COL-03", "Eli sees the discussion and answers on the scenario", async () => {
    await secondPage.reload();
    await openExperiment(secondPage, NAME, "Shared with me");
    await expect(secondPage.getByRole("list", { name: "Comments on scenarios, runs and results" })).toContainText("Run 1 · Free · minizinc · Number of products");
    await secondPage.getByLabel("Comment on scenario Free").fill("Keep it, it is the reference");
    await secondPage.getByLabel("Comments on scenario Free").getByRole("button", { name: "Comment" }).click();
    await expect(page.getByLabel("Comments on scenario Free")).toContainText("Keep it, it is the reference", { timeout: 10_000 });
  });

  await step(page, "LAB-COL-02", "Both edit at once: Eli saves first, Dana is told and chooses", async () => {
    await page.getByRole("button", { name: "Edit Experiment" }).click();
    await secondPage.getByRole("button", { name: "Edit Experiment" }).click();
    await secondPage.getByRole("textbox", { name: "Hypothesis of the experiment" }).fill("Z3 is faster than MiniZinc");
    await secondPage.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("status").filter({ hasText: "was saved by another user while you edit" })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("textbox", { name: "Ex: biology, chemistry, physics" }).fill("cars, solvers, round 2");
    await page.getByRole("button", { name: "Save Changes" }).click();
    const conflict = page.getByRole("dialog");
    await expect(conflict).toContainText(`by ${env.USER2.name}: hypothesis changed`);
    await page.screenshot({ path: path.join(OUT, "25b-conflict.png") });
    await conflict.getByRole("button", { name: "Save mine over theirs" }).click();
    await expect(page.getByRole("heading", { name: NAME, exact: true })).toBeVisible();
  });

  await step(page, "LAB-COL-04", "Filters: status and type", async () => {
    await backToList(page);
    await page.getByRole("button", { name: "Filters" }).click();
    const filters = page.getByRole("form", { name: "Filters" });
    await filters.getByLabel("Status").selectOption("draft");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`${NAME} \\(copy\\)`) })).toBeVisible();
    await filters.getByLabel("Status").selectOption("completed");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`${NAME} \\(copy\\)`) })).toHaveCount(0);
    await filters.getByRole("button", { name: "Clear" }).click();
  });

  await step(page, "LAB-CF-05", "Publish as a template, then start a new experiment from it", async () => {
    await openExperiment(page, `${NAME} (copy)`);
    await page.getByRole("button", { name: "Publish as Template" }).click();
    await page.getByRole("dialog").getByRole("button", { name: /Experiment Template/ }).click();
    await backToList(page);
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await page.getByRole("button", { name: "Import Template" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("cell", { name: new RegExp(`^${esc(NAME)} \\(copy\\)`) }).first().click();
    await modal.getByRole("button", { name: "Apply Template" }).click();
    await expect(page.getByRole("textbox", { name: "Name of the experiment" })).not.toHaveValue("");
  });

  await step(page, "LAB-EX-06", "Archive from the list, find it in Archived, restore it", async () => {
    await backToList(page);
    const row = page.getByRole("row", { name: new RegExp(`^draft ${NAME} Solvers`) });
    await row.getByRole("button", { name: "Archive experiment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Accept" }).click();
    await expect(row).toHaveCount(0);
    await page.getByRole("button", { name: "Archived" }).click();
    const archived = page.getByRole("dialog").getByRole("row", { name: new RegExp(NAME) }).first();
    await archived.getByRole("button", { name: "Restore experiment" }).click();
    await page.getByRole("dialog").filter({ hasText: "restore" }).getByRole("button", { name: "Accept" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`^draft ${NAME} Solvers`) })).toBeVisible();
  });

  await step(page, "LAB-EX-05", "Delete: with completed runs it is archived instead; a fresh copy is deleted", async () => {
    const row = page.getByRole("row", { name: new RegExp(`^draft ${NAME} Solvers`) });
    await row.getByRole("button", { name: "Delete experiment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Accept" }).click();
    await expect(toast(page, /archived/i)).toBeVisible();
    await expect(row).toHaveCount(0);
    const copy = page.getByRole("row", { name: new RegExp(`${NAME} \\(copy\\)`) });
    if (await copy.count()) {
      await copy.first().getByRole("button", { name: "Delete experiment" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Accept" }).click();
      await expect(toast(page, "Experiment deleted successfully")).toBeVisible();
    }
  });

  const failed = log.filter((entry) => !entry.ok);
  console.log(`\nWALKTHROUGH: ${log.length - failed.length}/${log.length} steps passed`);
  failed.forEach((entry) => console.log(`  FAILED ${entry.n} ${entry.step}: ${entry.note}`));
});
