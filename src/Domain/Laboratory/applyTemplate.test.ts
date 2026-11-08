import { applyTemplate } from "./applyTemplate";
import { SolverDescriptor } from "./Entities/SolverConfig";

const catalog: SolverDescriptor[] = [
  {
    id: "z3",
    name: "Microsoft Z3",
    versions: ["4.13.0", "4.12.6"],
    parameters: [
      { name: "timeOut", label: "Time out", type: "integer", default: 60 },
      { name: "mode", label: "Mode", type: "enum", default: "satisfiability" },
    ],
  },
  { id: "minizinc", name: "MiniZinc", versions: ["2.8.5"], parameters: [{ name: "timeOut", label: "Time out", type: "integer", default: 60 }] },
];

const template: any = {
  id: "template-1",
  version: 3,
  name: "Operational context comparison",
  description: "Compares the same models without and with a context.",
  hypothesis: "The context reduces the configuration space.",
  labels: ["predefined", "operational-context"],
  projectId: "project-a",
  metrics: [
    { id: "public", userId: null, name: "Number of products" },
    { id: "mine", userId: "nora", name: "My metric" },
    { id: "alices", userId: "alice", name: "Alice's metric" },
  ],
  scenarios: [
    { id: "s1", name: "Without context", models: [{ modelId: "m1", model: { elements: [] } }], solverConfigs: { z3: { mode: "enumeration", timeOut: 120 } } },
    {
      id: "s2",
      name: "With context",
      models: [{ modelId: "m1" }, { modelId: "m2" }],
      solverConfigs: { z3: { version: "4.12.6", randomSeed: 7 }, minizinc: { version: "1.0" }, gone: { version: "1" } },
      operationalContext: { activeFeatures: ["GPS"], inactiveFeatures: [], extraConstraints: "GPS => Car" },
    },
  ],
};

let next = 0;
const newId = () => `new-${++next}`;

test("the base configuration is inherited, with new scenario ids and the template as origin", () => {
  next = 0;
  const applied = applyTemplate(template, { projectId: "project-n", userId: "nora", catalog, newId });

  expect(applied).toMatchObject({
    name: "Operational context comparison",
    description: template.description,
    hypothesis: template.hypothesis,
    origin: { id: "template-1", version: 3, name: "Operational context comparison" },
  });
  expect(applied.scenarios.map((s) => [s.id, s.name])).toEqual([["new-1", "Without context"], ["new-2", "With context"]]);
  expect(applied.scenarios[1].operationalContext).toEqual(template.scenarios[1].operationalContext);
  // A copy: editing the form does not change the template
  applied.scenarios[1].operationalContext!.activeFeatures.push("Radio");
  expect(template.scenarios[1].operationalContext.activeFeatures).toEqual(["GPS"]);
});

test("the predefined label marks the catalog, not the new experiment", () => {
  expect(applyTemplate(template, { projectId: "project-n", catalog, newId }).labels).toEqual(["operational-context"]);
});

test("solver settings follow the catalog in use", () => {
  const [first, second] = applyTemplate(template, { projectId: "project-n", catalog, newId }).scenarios;

  // No version in the template: the newest; the template's values over the defaults
  expect(first.solverConfigs).toEqual({ z3: { version: "4.13.0", timeOut: 120, mode: "enumeration" } });
  // An offered version is kept; one no longer offered becomes the newest; unknown parameters are dropped
  expect(second.solverConfigs.z3).toEqual({ version: "4.12.6", timeOut: 60, mode: "satisfiability" });
  expect(second.solverConfigs.minizinc).toEqual({ version: "2.8.5", timeOut: 60 });
  // A solver the catalog does not offer stays, for the form to say so
  expect(second.solverConfigs.gone).toEqual({ version: "1" });
});

test("models are kept only for the template's own project (LAB-NF-05)", () => {
  const elsewhere = applyTemplate(template, { projectId: "project-n", catalog, newId });
  expect(elsewhere.scenarios.map((s) => s.models)).toEqual([[], []]);
  expect(elsewhere.modelsLeftOut).toBe(3);

  const same = applyTemplate(template, { projectId: "project-a", catalog, newId });
  expect(same.scenarios.map((s) => s.models.map((m) => m.modelId))).toEqual([["m1"], ["m1", "m2"]]);
  expect(same.modelsLeftOut).toBe(0);

  // No project chosen yet, or a template without project: none
  expect(applyTemplate(template, { projectId: "", catalog, newId }).modelsLeftOut).toBe(3);
  expect(applyTemplate({ ...template, projectId: null }, { projectId: "", catalog, newId }).modelsLeftOut).toBe(3);
});

test("another user's private metrics are left out (LAB-MT-02)", () => {
  const applied = applyTemplate(template, { projectId: "project-n", userId: "nora", catalog, newId });
  expect(applied.metrics.map((m) => m.id)).toEqual(["public", "mine"]);
  expect(applied.metricsLeftOut).toEqual(["Alice's metric"]);
});
