import AxiosMockAdapter from "axios-mock-adapter";
import {
  createMetric,
  getPublicMetrics,
  publishMetrics,
  updateMetric,
} from "../DataProvider/Services/metricService";
import { LABORATORY_CLIENT } from "../Infraestructure/AxiosConfig";

describe("front-back metrics contract", () => {
  const http = new AxiosMockAdapter(LABORATORY_CLIENT);

  afterEach(() => {
    http.reset();
  });

  afterAll(() => {
    http.restore();
  });

  test("loads public metrics using the backend response contract", async () => {
    const backendResponse = [
      {
        id: "metric-1",
        name: "Accuracy",
        formula: "correct / total",
        unit: "%",
        script: "return accuracy",
        userId: null,
      },
    ];
    http.onGet("/metrics/public").reply(200, backendResponse);

    const metrics = await getPublicMetrics();

    expect(metrics).toEqual(backendResponse);
    expect(metrics[0]).toMatchObject({
      id: "metric-1",
      name: "Accuracy",
      formula: "correct / total",
      userId: null,
    });
  });

  test("creates, updates, and publishes a metric through backend routes", async () => {
    const metric = {
      id: "metric-1",
      name: "Accuracy",
      formula: "correct / total",
      unit: "%",
      script: "return accuracy",
      userId: "user-1",
    };
    const created = { ...metric };
    const updated = { ...metric, name: "Updated accuracy" };
    http.onPost("/metrics", metric).reply(201, created);
    http.onPut("/metrics/metric-1", updated).reply(200, updated);
    http.onPost("/metrics/publish", ["metric-1"]).reply(200, {
      message: "Metrics published successfully",
    });

    await expect(createMetric(metric)).resolves.toEqual(created);
    await expect(updateMetric("metric-1", updated)).resolves.toEqual(updated);
    await expect(publishMetrics([{ id: "metric-1" }])).resolves.toBeUndefined();

    expect(http.history.post).toHaveLength(2);
    expect(http.history.post[1].url).toBe("/metrics/publish");
    expect(http.history.put).toHaveLength(1);
  });
});