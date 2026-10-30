import { Experiment, ExperimentDetailed } from "./Experiment";
import { ExperimentRoleEnum } from "./Collaborator";

describe("Experiment", () => {
  test("sets default state and timestamps", () => {
    const experiment = new Experiment(
      "experiment-1",
      "Trial",
      "Description",
      "Hypothesis",
      [],
      ExperimentRoleEnum.OWNER,
      false,
      false,
      "2026-01-01",
      "2026-01-02"
    );

    expect(experiment).toMatchObject({
      id: "experiment-1",
      name: "Trial",
      description: "Description",
      hypothesis: "Hypothesis",
      labels: [],
      userRole: ExperimentRoleEnum.OWNER,
      version: 1,
      status: "draft",
      isTemplate: false,
      isBenchmark: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });
  });

  test("creates detailed experiments with scenarios, metrics, and publication flags", () => {
    const scenarios = [{ id: "scenario-1" }] as any;
    const metrics = [{ id: "metric-1" }] as any;
    const experiment = new ExperimentDetailed(
      "experiment-1",
      "Template",
      "Description",
      "Hypothesis",
      scenarios,
      metrics,
      ["demo"],
      ExperimentRoleEnum.DIRECTOR,
      true,
      true,
      "Author",
      "created",
      "updated"
    );

    expect(experiment.scenarios).toBe(scenarios);
    expect(experiment.metrics).toBe(metrics);
    expect(experiment.author).toBe("Author");
    expect(experiment.isTemplate).toBe(true);
    expect(experiment.isBenchmark).toBe(true);
  });
});