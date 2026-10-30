import { buildComparison, seriesAcrossRuns } from "./comparison";
import { Results, ResultRow } from "../../../../Domain/Laboratory/Entities/Results";

const row = (runNumber: number, scenarioName: string, solverId: string, metricId: string, value: number | null): ResultRow => ({
    runId: `run-${runNumber}`, runNumber, runStatus: "completed", experimentVersion: 1,
    scenarioRunId: `run-${runNumber}/${scenarioName}/${solverId}`, scenarioId: scenarioName, scenarioName,
    solverId, solverVersion: "1", scenarioRunStatus: "completed",
    metricId, metricCode: null, metricName: metricId, unit: null,
    value, reason: value === null ? "not computable" : null, simulated: false,
});

const results = (rows: ResultRow[]): Results => ({
    metrics: [{ id: "products", code: null, name: "Products", unit: "products", formula: null, requires: null }, { id: "depth", code: "REQ-14", name: "Depth", unit: "levels", formula: null, requires: null }],
    runs: [],
    rows,
});

describe("comparison table (LAB-MT-04)", () => {
    const data = results([
        row(1, "B", "z3", "products", 4), row(1, "A", "minizinc", "products", 8), row(1, "A", "minizinc", "depth", 2), row(1, "B", "z3", "depth", null),
    ]);

    test("one column per scenario run, ordered; every value at its place", () => {
        const comparison = buildComparison(data);
        expect(comparison.columns.map((c) => c.label)).toEqual(["A · minizinc", "B · z3"]);
        expect(comparison.cell("products", "run-1/B/z3")?.value).toBe(4);
        expect(comparison.cell("depth", "run-1/B/z3")?.reason).toBe("not computable");
    });

    test("filters keep the chosen metrics and scenarios", () => {
        const comparison = buildComparison(data, { metricIds: new Set(["depth"]), scenarios: new Set(["A"]) });
        expect(comparison.metrics.map((m) => m.id)).toEqual(["depth"]);
        expect(comparison.columns.map((c) => c.key)).toEqual(["run-1/A/minizinc"]);
    });

    test("with several runs, the run is in the label", () => {
        const comparison = buildComparison(results([row(1, "A", "z3", "products", 4), row(2, "A", "z3", "products", 5)]));
        expect(comparison.columns.map((c) => c.label)).toEqual(["A · z3 · run 1", "A · z3 · run 2"]);
    });
});

describe("series across runs (LAB-MT-04)", () => {
    test("one series per scenario and solver, a point per run, gaps kept", () => {
        const { runNumbers, series } = seriesAcrossRuns(
            results([row(1, "A", "z3", "products", 4), row(2, "A", "z3", "products", 6), row(2, "B", "z3", "products", 1)]),
            "products"
        );
        expect(runNumbers).toEqual([1, 2]);
        expect(series).toEqual([
            { name: "A · z3", points: [{ runNumber: 1, value: 4 }, { runNumber: 2, value: 6 }] },
            { name: "B · z3", points: [{ runNumber: 1, value: null }, { runNumber: 2, value: 1 }] },
        ]);
    });
});
