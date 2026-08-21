import AxiosMockAdapter from "axios-mock-adapter";
import {
  createExperiment,
  getExperimentDetailed,
  getUserExperiments,
} from "../DataProvider/Services/experimentService";
import { LABORATORY_CLIENT } from "../Infraestructure/AxiosConfig";

describe("front-back experiments contract", () => {
  const http = new AxiosMockAdapter(LABORATORY_CLIENT);

  afterEach(() => {
    http.reset();
  });

  afterAll(() => {
    http.restore();
  });

  test("loads the user's experiments using the backend query contract", async () => {
    const filter = {
      userId: "user-1",
      name: "trial",
      pageNumber: 2,
      pageSize: 10,
    } as any;
    const backendResponse = {
      transactionId: "getUserExperiments",
      totalCount: 1,
      data: [{
        id: "experiment-1",
        name: "Trial",
        version: 1,
        labels: ["demo"],
        status: "draft",
        userRole: "owner",
        isTemplate: false,
        isBenchmark: false,
      }],
    };
    http.onGet("/experiments", {
      params: {
        userId: "user-1",
        name: "trial",
        pageNumber: 2,
        pageSize: 10,
      },
    }).reply(200, backendResponse);

    const response = await getUserExperiments(filter);

    expect(response).toEqual(backendResponse);
    expect(response.data?.[0]).toMatchObject({
      id: "experiment-1",
      name: "Trial",
      status: "draft",
      userRole: "owner",
    });
  });

  test("creates an experiment and then loads its detailed representation", async () => {
    const experiment = {
      id: "experiment-1",
      name: "Trial",
      version: 1,
      labels: ["demo"],
      status: "draft",
      isTemplate: false,
      isBenchmark: false,
      description: "Description",
      hypothesis: "Hypothesis",
      scenarios: [{ id: "scenario-1", modelId: "model-1" }],
      metrics: [{ id: "metric-1", name: "Accuracy" }],
    };
    http.onPost("/experiments", experiment).reply(201, experiment);
    http.onGet("/experiments/experiment-1/detailed").reply(200, experiment);

    const created = await createExperiment(experiment);
    const detailed = await getExperimentDetailed("experiment-1");

    expect(created).toEqual(experiment);
    expect(detailed).toEqual(experiment);
    expect(detailed.scenarios).toHaveLength(1);
    expect(detailed.metrics).toHaveLength(1);
  });
});