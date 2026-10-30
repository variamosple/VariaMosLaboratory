import { getUserProjects, resetUserProjects } from "./userProjectsService";
import { PROJECTS_CLIENT } from "../../Infraestructure/AxiosConfig";

describe("user projects service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetUserProjects();
  });

  test("merges owned and shared projects, once per page", async () => {
    const get = jest.spyOn(PROJECTS_CLIENT, "get").mockResolvedValue({
      data: {
        owned_projects: [{ id: "p2", name: "Robots" }, { id: "p1", name: "Cars" }],
        shared_projects: [{ id: "p3", name: "" }, { id: "p1", name: "Cars" }],
      },
    } as any);

    const expected = [
      { id: "p1", name: "Cars" },
      { id: "p3", name: "p3" },
      { id: "p2", name: "Robots" },
    ];
    await expect(getUserProjects()).resolves.toEqual(expected);
    await expect(getUserProjects()).resolves.toEqual(expected);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/getProjects");
  });

  test("tries again after a failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const get = jest.spyOn(PROJECTS_CLIENT, "get")
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ data: { owned_projects: [], shared_projects: [] } } as any);

    await expect(getUserProjects()).rejects.toThrow("network error");
    await expect(getUserProjects()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
