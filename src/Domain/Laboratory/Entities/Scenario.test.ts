import { Scenario } from "./Scenario";

test("Scenario stores optional model and solver configuration", () => {
  const model = { id: "model-1" } as any;
  const solverConfigs = { solver: "z3" } as any;
  const scenario = new Scenario("scenario-1", "model-1", model, solverConfigs);

  expect(scenario).toEqual({
    id: "scenario-1",
    modelId: "model-1",
    model,
    solverConfigs,
  });
});