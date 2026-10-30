import { Scenario, scenarioFeatures } from "./Scenario";
import { defaultSolverSettings } from "./SolverConfig";

test("Scenario stores its models and solver settings", () => {
  const models = [{ modelId: "model-1" }, { modelId: "model-2" }];
  const solverConfigs = { z3: { version: "4.13.0", timeOut: 60 } };
  const scenario = new Scenario("scenario-1", models, solverConfigs);

  expect(scenario).toEqual({ id: "scenario-1", models, solverConfigs });
});

test("a new scenario has no model and no solver", () => {
  expect(new Scenario("scenario-1")).toEqual({ id: "scenario-1", models: [], solverConfigs: {} });
});

test("the features of a scenario are the element names of all its models, once each", () => {
  const scenario = new Scenario("scenario-1", [
    { modelId: "m1", model: { elements: [{ name: "GPS" }, { name: "Car" }] } as any },
    { modelId: "m2", model: { elements: [{ name: "Radio" }, { name: "Car" }] } as any },
    { modelId: "m3" },
  ]);

  expect(scenarioFeatures(scenario)).toEqual(["Car", "GPS", "Radio"]);
});

test("a solver added to a scenario starts on its newest version with the default parameters", () => {
  const settings = defaultSolverSettings({
    id: "z3",
    name: "Microsoft Z3",
    versions: ["4.13.0", "4.12.6"],
    parameters: [
      { name: "timeOut", label: "Time out", type: "integer", default: 60 },
      { name: "mode", label: "Mode", type: "enum", default: "satisfiability" },
    ],
  });

  expect(settings).toEqual({ version: "4.13.0", timeOut: 60, mode: "satisfiability" });
});
