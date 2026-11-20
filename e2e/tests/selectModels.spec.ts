import { Page, Route } from "@playwright/test";
import { test, expect, env } from "../support/fixtures";

const CARS = env.PROJECTS[0];
const ROBOTS = env.PROJECTS[1];
const PROJECTS_ORIGIN = new URL(env.PROJECTS_URL).origin;

/** Answers a request of vms_projects differently from the fixtures (the last route registered wins). */
const answer = (page: Page, pathname: string, handler: (route: Route, url: URL) => Promise<void>) =>
  page.route(
    (url) => url.origin === PROJECTS_ORIGIN && url.pathname === pathname,
    (route) => handler(route, new URL(route.request().url()))
  );

const openSelectModels = async (page: Page) => {
  await page.goto("");
  await page.getByRole("button", { name: "Create Experiment" }).click();
  await page.getByRole("button", { name: "Select models" }).click();
  return page.getByRole("dialog");
};

test.describe("Select Models when vms_projects fails", () => {
  test("a list that cannot be loaded is reported, the other lists are shown, and opening again retries", async ({ page }) => {
    let calls = 0;
    await answer(page, "/getTemplateProjects", (route) =>
      ++calls === 1 ? route.fulfill({ status: 500, json: { detail: "Internal Server Error" } }) : route.fallback()
    );

    const models = await openSelectModels(page);

    await expect(models.getByText("Loading projects...")).toBeHidden();
    await expect(models.getByText(CARS.name)).toBeVisible();
    await expect(models.getByText("The public projects could not be loaded.")).toBeVisible();

    await models.getByRole("button", { name: "Close" }).click();
    await expect(models).toBeHidden();
    await page.getByRole("button", { name: "Select models" }).click();
    await expect(page.getByRole("dialog").getByText(CARS.name)).toBeVisible();
    await expect(page.getByRole("dialog").getByText("could not be loaded")).toBeHidden();
    expect(calls).toBe(2);
  });

  test("the user's own projects that cannot be loaded are reported too", async ({ page }) => {
    // The form loads its own project list first; only the request of the window fails
    await page.goto("");
    await page.getByRole("button", { name: "Create Experiment" }).click();
    await expect(page.getByRole("combobox", { name: "Project" })).toContainText(CARS.name);
    await answer(page, "/getProjects", (route) => route.fulfill({ status: 500, json: { detail: "Internal Server Error" } }));

    await page.getByRole("button", { name: "Select models" }).click();
    const models = page.getByRole("dialog");

    await expect(models.getByText("Your projects could not be loaded.")).toBeVisible();
    await expect(models.getByText("Loading projects...")).toBeHidden();
    await expect(models.getByText("No projects or model found")).toBeVisible();
  });

  test("a project that cannot be opened, or has no product lines, is left out", async ({ page }) => {
    // Robots fails; a shared project comes back without product lines
    const SHARED = { id: "project-shared-empty", name: "Shared project without product lines" };
    await answer(page, "/getProjects", (route) =>
      route.fulfill({
        json: {
          owned_projects: env.PROJECTS.map((project: { id: string; name: string }) => ({ id: project.id, name: project.name })),
          shared_projects: [SHARED],
        },
      })
    );
    await answer(page, "/getProject", async (route, url) => {
      const projectId = url.searchParams.get("project_id");
      if (projectId === ROBOTS.id) return route.fulfill({ status: 500, json: { detail: "Internal Server Error" } });
      if (projectId === SHARED.id) return route.fulfill({ json: { message: "ok", data: { project: { project: {} } } } });
      return route.fallback();
    });

    const models = await openSelectModels(page);

    await expect(models.getByText("Loading projects...")).toBeHidden();
    await expect(models.getByText(CARS.name)).toBeVisible();
    await models.getByText(CARS.name).click();
    await models.getByText("Product line", { exact: true }).click();
    await models.getByText("Domain Engineering").click();
    await expect(models.getByRole("checkbox", { name: env.MODEL.name })).toBeVisible();
    await expect(models.getByText(ROBOTS.name)).toBeHidden();

    await models.getByRole("tab", { name: "Shared" }).click();
    await expect(models.getByText("No projects or model found")).toBeVisible();
  });
});
