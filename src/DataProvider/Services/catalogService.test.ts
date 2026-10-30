import { getSolvers, resetSolverCatalog } from "./catalogService";
import { LABORATORY_CLIENT } from "../../Infraestructure/AxiosConfig";

describe("catalog service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetSolverCatalog();
  });

  test("loads the solver catalog once", async () => {
    const solvers = [{ id: "z3", name: "Microsoft Z3", versions: ["4.13.0"], parameters: [] }];
    const get = jest.spyOn(LABORATORY_CLIENT, "get").mockResolvedValue({ data: solvers } as any);

    await expect(getSolvers()).resolves.toBe(solvers);
    await expect(getSolvers()).resolves.toBe(solvers);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/catalog/solvers");
  });

  test("tries again after a failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const get = jest.spyOn(LABORATORY_CLIENT, "get")
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ data: [] } as any);

    await expect(getSolvers()).rejects.toThrow("network error");
    await expect(getSolvers()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
