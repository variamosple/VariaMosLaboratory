import fs from "fs";
import { test as base, expect, Page } from "@playwright/test";

const env = require("./env");

/**
 * The two services the Laboratory interface calls besides its own backend:
 * - the Administration module gives the session (and the token signed for the run),
 * - vms_projects lists the user's projects and their models.
 * Their answers follow the shapes the interface reads.
 */
async function answerPlatformServices(page: Page, second = false) {
  const token = fs.readFileSync(second ? env.TOKEN2_FILE : env.TOKEN_FILE, "utf8").trim();
  const user = second ? env.USER2 : env.USER;

  await page.route(`${env.ADMIN_URL}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/auth/session-info") {
      return route.fulfill({ json: { transactionId: "session-info", data: { user, authToken: token } } });
    }
    return route.fulfill({ json: { transactionId: "e2e", data: null } });
  });

  const projectInfo = (project: { id: string; name: string }) => ({
    id: project.id,
    name: project.name,
    owner_id: env.USER.id,
    template: false,
    description: "",
    source: "",
    author: env.USER.name,
    date: "2026-10-01T00:00:00Z",
  });

  await page.route(`${env.PROJECTS_URL}/**`, async (route) => {
    const url = new URL(route.request().url());
    switch (url.pathname) {
      case "/getProjects":
        return route.fulfill({ json: { owned_projects: env.PROJECTS.map(projectInfo), shared_projects: [] } });
      case "/getTemplateProjects":
        return route.fulfill({ json: { message: "ok", data: { projects: [] } } });
      case "/getProject": {
        const projectId = url.searchParams.get("project_id");
        const models = projectId === env.MODEL.projectId
          ? [{ id: env.MODEL.id, name: env.MODEL.name, type: "FeatureModel", elements: env.MODEL.elements, relationships: [] }]
          : [];
        const productLines = [{
          id: "pl-" + projectId,
          name: "Product line",
          scope: { models: [] },
          domainEngineering: { models, languagesAllowed: [] },
          applicationEngineering: { models: [], applications: [], languagesAllowed: [] },
        }];
        return route.fulfill({ json: { message: "ok", data: { project: { project: { id: projectId, productLines } } } } });
      }
      default:
        return route.fulfill({ status: 404, json: { message: "Error: not answered in the end-to-end tests" } });
    }
  });
}

export const test = base.extend<{ secondPage: Page }>({
  page: async ({ page }, use) => {
    await answerPlatformServices(page);
    await use(page);
  },
  /** The same interface, signed in as the second researcher, in a browser context of its own. */
  secondPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await answerPlatformServices(page, true);
    await use(page);
    await context.close();
  },
});

/**
 * Narrows the experiment list to one name. The list is sorted by name and
 * paginated: once the suite has made enough experiments, a new one is not on
 * the first page.
 */
export async function showInList(page: Page, name: string) {
  const search = page.getByRole("textbox", { name: "Search" });
  await search.fill(name);
  await search.press("Enter");
  await expect(page.getByRole("cell", { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first()).toBeVisible();
}

export { expect, env };
