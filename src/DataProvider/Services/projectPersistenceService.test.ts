import ProjectPersistenceService from "./projectPersistenceService";
import { PROJECTS_CLIENT } from "../../Infraestructure/AxiosConfig";

/** Calls a service method and waits for one of its callbacks. */
const settle = (call: (ok: (value: any) => void, fail: (error: any) => void) => void) =>
  new Promise<{ ok?: any; error?: any }>((resolve) => call((ok) => resolve({ ok }), (error) => resolve({ error })));

describe("project persistence service, calls of vms_projects used by Select Models", () => {
  const service = new ProjectPersistenceService();

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("a failed request reaches the error callback of each call", async () => {
    jest.spyOn(PROJECTS_CLIENT, "get").mockRejectedValue(new Error("Request failed with status code 500"));

    for (const call of [
      (ok: any, fail: any) => service.getProjectsByUser("u1", ok, fail),
      (ok: any, fail: any) => service.getTemplateProjectsByUser("u1", ok, fail),
      (ok: any, fail: any) => service.openProject("u1", "p1", ok, fail),
    ]) {
      const result = await settle(call);
      expect(result.ok).toBeUndefined();
      expect(result.error).toEqual(new Error("Request failed with status code 500"));
    }
  });

  test("an error of the success callback reaches the error callback", async () => {
    jest.spyOn(PROJECTS_CLIENT, "get").mockResolvedValue({ data: { message: "Ok", data: { project: { project: {} } } } } as any);

    const error = await new Promise((resolve) =>
      service.openProject("u1", "p1", (record: any) => record.project.productLines.some(Boolean), resolve)
    );

    expect(error).toBeInstanceOf(TypeError);
  });

  test("answers are passed on, with an empty list for a list that is missing", async () => {
    const get = jest.spyOn(PROJECTS_CLIENT, "get").mockImplementation(async (url: string) => {
      if (url === "/getProjects") return { data: { shared_projects: [{ id: "p2", name: "Shared" }] } } as any;
      if (url === "/getTemplateProjects") return { data: { message: "Ok", data: { projects: [{ id: "p3", name: "Public" }] } } } as any;
      return { data: { message: "Ok", data: { project: { id: "p1", project: { productLines: [] } } } } } as any;
    });

    expect(await settle((ok, fail) => service.getProjectsByUser("u1", ok, fail))).toEqual({
      ok: { owned_projects: [], shared_projects: [{ id: "p2", name: "Shared" }] },
    });
    expect(await settle((ok, fail) => service.getTemplateProjectsByUser("u1", ok, fail))).toEqual({ ok: [{ id: "p3", name: "Public" }] });
    expect(await settle((ok, fail) => service.openProject("u1", "p1", ok, fail))).toEqual({
      ok: { id: "p1", project: { productLines: [] } },
    });
    expect(get).toHaveBeenCalledWith("/getProject", { params: { project_id: "p1" } });
  });

  test("a list that is missing in the answer of /getProjects is empty", async () => {
    jest.spyOn(PROJECTS_CLIENT, "get").mockResolvedValue({ data: { owned_projects: [{ id: "p1", name: "Mine" }] } } as any);

    expect(await settle((ok, fail) => service.getProjectsByUser("u1", ok, fail))).toEqual({
      ok: { owned_projects: [{ id: "p1", name: "Mine" }], shared_projects: [] },
    });
  });

  test("a failure without an error callback is only logged", async () => {
    jest.spyOn(PROJECTS_CLIENT, "get").mockRejectedValue(new Error("Network Error"));
    const ok = jest.fn();

    service.getProjectsByUser("u1", ok, undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ok).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Something wrong in getProjectsByUser Service: Error: Network Error");
  });

  describe("the lists of Select Models", () => {
    const answers = (failing: string[]) =>
      jest.spyOn(PROJECTS_CLIENT, "get").mockImplementation(async (url: string) => {
        if (failing.includes(url)) throw new Error("Request failed with status code 500");
        if (url === "/getProjects") return { data: { owned_projects: [{ id: "p1", name: "Mine" }], shared_projects: [{ id: "p2", name: "Shared" }] } } as any;
        return { data: { message: "Ok", data: { projects: [{ id: "p3", name: "Public" }] } } } as any;
      });

    test("all lists, and no error", async () => {
      answers([]);
      expect(await service.getProjectLists("u1")).toEqual({
        privateResponse: { owned_projects: [{ id: "p1", name: "Mine" }], shared_projects: [{ id: "p2", name: "Shared" }] },
        publicResponse: [{ id: "p3", name: "Public" }],
        error: "",
      });
    });

    test("the public projects fail: the user's projects are kept", async () => {
      answers(["/getTemplateProjects"]);
      expect(await service.getProjectLists("u1")).toEqual({
        privateResponse: { owned_projects: [{ id: "p1", name: "Mine" }], shared_projects: [{ id: "p2", name: "Shared" }] },
        publicResponse: [],
        error: "The public projects could not be loaded. Close this window and open it again to retry.",
      });
    });

    test("the user's projects fail: the public projects are kept", async () => {
      answers(["/getProjects"]);
      expect(await service.getProjectLists("u1")).toEqual({
        privateResponse: { owned_projects: [], shared_projects: [] },
        publicResponse: [{ id: "p3", name: "Public" }],
        error: "Your projects could not be loaded. Close this window and open it again to retry.",
      });
    });

    test("both fail", async () => {
      answers(["/getProjects", "/getTemplateProjects"]);
      expect(await service.getProjectLists("u1")).toEqual({
        privateResponse: { owned_projects: [], shared_projects: [] },
        publicResponse: [],
        error: "Your projects and the public projects could not be loaded. Close this window and open it again to retry.",
      });
    });
  });

  test("an answer without any list, or with an error message, is an error", async () => {
    jest.spyOn(PROJECTS_CLIENT, "get").mockImplementation(async (url: string) =>
      url === "/getProjects" ? ({ data: {} } as any) : ({ data: { message: "Error: no access" } } as any)
    );

    expect((await settle((ok, fail) => service.getProjectsByUser("u1", ok, fail))).error.message)
      .toBe("Invalid server response: Missing owned_projects or shared_projects");
    expect((await settle((ok, fail) => service.getTemplateProjectsByUser("u1", ok, fail))).error.message).toContain("Error: no access");
    expect((await settle((ok, fail) => service.openProject("u1", "p1", ok, fail))).error.message).toContain("Error: no access");
  });
});
