import {
  archiveExperiment,
  copyExperiment,
  createExperiment,
  deleteExperiment,
  getArchivedExperiments,
  getCollaborators,
  getExperimentDetailed,
  getExperimentHistory,
  getExperimentVersion,
  getGroupExperiments,
  getSharedExperiments,
  getTemplateBenchmarks,
  getTemplateExperiments,
  getUserExperiments,
  markExperimentReady,
  publishAsBenchmark,
  publishAsTemplate,
  removeCollaborator,
  restoreExperiment,
  restoreExperimentVersion,
  shareExperiment,
  updateExperiment,
} from "./experimentService";
import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";
import { ExperimentRoleEnum } from "../../Domain/Laboratory/Entities/Collaborator";

describe("experiment service", () => {
  const filter = {
    userId: "user-1",
    name: "trial",
    pageNumber: 2,
    pageSize: 10,
  } as any;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    [getUserExperiments, "/experiments"],
    [getSharedExperiments, "/experiments/shared"],
    [getGroupExperiments, "/experiments/groups"],
    [getTemplateExperiments, "/experiments/templates"],
    [getTemplateBenchmarks, "/experiments/benchmarks"],
    [getArchivedExperiments, "/experiments/archived"],
  ])("loads experiments from %s", async (request, path) => {
    const data = { content: [{ id: "experiment-1" }] };
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data } as any);

    await expect(request(filter)).resolves.toBe(data);
    expect(get).toHaveBeenCalledWith(path, { params: filter });
  });

  test("uses empty parameters when listing without a filter", async () => {
    const data = { content: [] };
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data } as any);

    await expect(getUserExperiments(undefined as any)).resolves.toBe(data);
    expect(get).toHaveBeenCalledWith("/experiments", { params: {} });
  });

  test("gets experiment details and history", async () => {
    const detailed = { id: "experiment-1", scenarios: [], metrics: [] };
    const history = [{ id: "event-1", experimentId: "experiment-1" }];
    const get = jest.spyOn(LABORATORY_CLIENT, "get")
      .mockResolvedValueOnce({ data: detailed } as any)
      .mockResolvedValueOnce({ data: history } as any);

    await expect(getExperimentDetailed("experiment-1")).resolves.toBe(detailed);
    await expect(getExperimentHistory("experiment-1")).resolves.toBe(history);
    expect(get).toHaveBeenNthCalledWith(1, "/experiments/experiment-1/detailed");
    expect(get).toHaveBeenNthCalledWith(2, "/experiments/experiment-1/history");
  });

  test("creates, updates, copies, and deletes an experiment", async () => {
    const experiment = { id: "experiment-1", name: "trial" } as any;
    const response = { id: "experiment-1" };
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: response } as any);
    const put = jest.spyOn(LABORATORY_CLIENT, "put").mockResolvedValue({ data: response } as any);
    const remove = jest.spyOn(LABORATORY_CLIENT, "delete").mockResolvedValue({ data: response } as any);

    await expect(createExperiment(experiment)).resolves.toBe(response);
    await expect(updateExperiment(experiment)).resolves.toBe(response);
    await expect(copyExperiment("experiment-1")).resolves.toBe(response);
    await expect(deleteExperiment("experiment-1")).resolves.toBe(response);

    expect(post).toHaveBeenCalledWith("/experiments", experiment);
    expect(post).toHaveBeenCalledWith("/experiments/experiment-1/copy", {});
    expect(put).toHaveBeenCalledWith("/experiments/experiment-1", experiment);
    expect(remove).toHaveBeenCalledWith("/experiments/experiment-1");
  });

  test("copies an experiment into a chosen project (LAB-EX-01)", async () => {
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: {} } as any);

    await copyExperiment("experiment-1", "project-1");

    expect(post).toHaveBeenCalledWith("/experiments/experiment-1/copy", { projectId: "project-1" });
  });

  test("archives, restores, and publishes an experiment", async () => {
    const response = { id: "experiment-1" };
    const put = jest.spyOn(LABORATORY_CLIENT, "put").mockResolvedValue({ data: response } as any);
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: response } as any);

    await expect(archiveExperiment("experiment-1")).resolves.toBe(response);
    await expect(restoreExperiment("experiment-1")).resolves.toBe(response);
    await expect(publishAsTemplate("experiment-1")).resolves.toBe(response);
    await expect(publishAsBenchmark("experiment-1")).resolves.toBe(response);

    expect(put).toHaveBeenNthCalledWith(1, "/experiments/experiment-1/archive");
    expect(put).toHaveBeenNthCalledWith(2, "/experiments/experiment-1/restore");
    expect(post).toHaveBeenNthCalledWith(1, "/experiments/experiment-1/publish/template");
    expect(post).toHaveBeenNthCalledWith(2, "/experiments/experiment-1/publish/benchmark");
  });

  test("marks an experiment Ready and passes the backend problems on", async () => {
    const put = jest.spyOn(LABORATORY_CLIENT, "put")
      .mockResolvedValueOnce({ data: { id: "experiment-1", status: "ready" } } as any)
      .mockRejectedValueOnce({ response: { status: 400, data: { details: ["Add at least one scenario."] } } });
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(markExperimentReady("experiment-1")).resolves.toEqual({ id: "experiment-1", status: "ready" });
    await expect(markExperimentReady("experiment-1")).rejects.toMatchObject({
      response: { data: { details: ["Add at least one scenario."] } },
    });
    expect(put).toHaveBeenCalledWith("/experiments/experiment-1/ready");
  });

  test("shares an experiment with a collaborator", async () => {
    const response = { success: true };
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: response } as any);

    await expect(shareExperiment("experiment-1", "editor@example.com", ExperimentRoleEnum.EDITOR))
      .resolves.toBe(response);

    expect(post).toHaveBeenCalledWith("/experiments/experiment-1/share", {
      userEmail: "editor@example.com",
      role: ExperimentRoleEnum.EDITOR,
    });
  });

  test("gets and restores a version", async () => {
    const version = { id: "experiment-1", version: 3 };
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data: version } as any);
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: version } as any);

    await expect(getExperimentVersion("experiment-1", 3)).resolves.toBe(version);
    await expect(restoreExperimentVersion("experiment-1", 3)).resolves.toBe(version);

    expect(get).toHaveBeenCalledWith("/experiments/experiment-1/version/3");
    expect(post).toHaveBeenCalledWith("/experiments/experiment-1/version/3/restore");
  });

  test("gets and removes collaborators", async () => {
    const collaborators = [{ id: "user-2", role: ExperimentRoleEnum.VIEWER }];
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data: collaborators } as any);
    const remove = jest.spyOn(LABORATORY_CLIENT, "delete").mockResolvedValue({ data: { success: true } } as any);

    await expect(getCollaborators("experiment-1")).resolves.toBe(collaborators);
    await expect(removeCollaborator("experiment-1", "user-2")).resolves.toEqual({ success: true });

    expect(get).toHaveBeenCalledWith("/experiments/experiment-1/collaborators");
    expect(remove).toHaveBeenCalledWith("/experiments/experiment-1/collaborators/user-2");
  });

  test("propagates API errors", async () => {
    const error = new Error("API unavailable");
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(LABORATORY_CLIENT, "get").mockRejectedValue(error);

    await expect(getExperimentDetailed("experiment-1")).rejects.toBe(error);
  });
});
describe("sharing and filters (LAB-COL-01, LAB-COL-04)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("write and execute are sent separately; a role is still accepted", async () => {
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: true } as any);

    await shareExperiment("e1", "eli@example.org", { write: false, execute: true });
    await shareExperiment("e1", "eli@example.org", ExperimentRoleEnum.VIEWER);

    expect(post).toHaveBeenNthCalledWith(1, "/experiments/e1/share", { userEmail: "eli@example.org", permissions: { write: false, execute: true } });
    expect(post).toHaveBeenNthCalledWith(2, "/experiments/e1/share", { userEmail: "eli@example.org", role: "viewer" });
  });

  test("only the filters set are sent", async () => {
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data: { data: [] } } as any);

    await getUserExperiments({ pageNumber: 1, pageSize: 10, status: "ready", researcher: "Dana", type: undefined } as any);

    expect(get).toHaveBeenCalledWith("/experiments", { params: { userId: undefined, name: undefined, pageNumber: 1, pageSize: 10, researcher: "Dana", status: "ready" } });
  });
});
