import { cancelRun, getRun, getRuns, startRun } from "./runService";
import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";

describe("run service", () => {
  afterEach(() => jest.restoreAllMocks());

  test("starts and cancels a run", async () => {
    const run = { id: "run-1", status: "pending" };
    const post = jest.spyOn(LABORATORY_CLIENT, "post").mockResolvedValue({ data: run } as any);

    await expect(startRun("exp-1")).resolves.toBe(run);
    await expect(cancelRun("exp-1", "run-1")).resolves.toBe(run);

    expect(post).toHaveBeenNthCalledWith(1, "/experiments/exp-1/runs");
    expect(post).toHaveBeenNthCalledWith(2, "/experiments/exp-1/runs/run-1/cancel");
  });

  test("reads the runs of an experiment and one run", async () => {
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data: [] } as any);

    await getRuns("exp-1");
    await getRun("exp-1", "run-1");

    expect(get).toHaveBeenNthCalledWith(1, "/experiments/exp-1/runs");
    expect(get).toHaveBeenNthCalledWith(2, "/experiments/exp-1/runs/run-1");
  });
});
