import {
  createMetric,
  deleteMetric,
  getMetricById,
  getPublicMetrics,
  getUserMetrics,
  publishMetrics,
  updateMetric,
} from "./metricService";
import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";

describe("metric service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("gets public metrics", async () => {
    const data = [{ id: "public-1" }];
    jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data } as any);

    await expect(getPublicMetrics()).resolves.toBe(data);
    expect(LABORATORY_CLIENT.get).toHaveBeenCalledWith("/metrics/public");
  });

  test("gets user metrics", async () => {
    const data = [{ id: "user-1" }];
    jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data } as any);

    await expect(getUserMetrics()).resolves.toBe(data);
    expect(LABORATORY_CLIENT.get).toHaveBeenCalledWith("/metrics/user");
  });

  test("gets a metric by id", async () => {
    const data = { id: "metric-1" };
    jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data } as any);

    await expect(getMetricById("metric-1")).resolves.toBe(data);
    expect(LABORATORY_CLIENT.get).toHaveBeenCalledWith("/metrics/metric-1");
  });

  test("creates, updates, and deletes a metric", async () => {
    const metric = { name: "quality" };
    const response = { id: "metric-1" };
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: response } as any);
    const put = jest.spyOn(LABORATORY_CLIENT, "put").mockResolvedValue({ data: response } as any);
    const remove = jest.spyOn(LABORATORY_CLIENT, "delete").mockResolvedValue({ data: response } as any);

    await expect(createMetric(metric)).resolves.toBe(response);
    await expect(updateMetric("metric-1", metric)).resolves.toBe(response);
    await expect(deleteMetric("metric-1")).resolves.toBe(response);

    expect(post).toHaveBeenCalledWith("/metrics", metric);
    expect(put).toHaveBeenCalledWith("/metrics/metric-1", metric);
    expect(remove).toHaveBeenCalledWith("/metrics/metric-1");
  });

  test("publishes metrics through the publish route, which checks the author", async () => {
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: {} } as any);
    const put = jest.spyOn(LABORATORY_CLIENT, "put");

    await expect(publishMetrics([{ id: "one" }, { id: "two" }])).resolves.toBeUndefined();

    expect(post).toHaveBeenCalledWith("/metrics/publish", ["one", "two"]);
    expect(put).not.toHaveBeenCalled();
  });

  test("propagates metric request errors", async () => {
    const error = new Error("network error");
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(LABORATORY_CLIENT, "get").mockRejectedValue(error);

    await expect(getPublicMetrics()).rejects.toBe(error);
  });
});