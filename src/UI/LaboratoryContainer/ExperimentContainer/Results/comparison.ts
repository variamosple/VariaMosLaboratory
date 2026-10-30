import { MetricDefinition, ResultRow, Results } from "../../../../Domain/Laboratory/Entities/Results";

/** A column of the comparison: one scenario run (a scenario, a solver, a run). */
export interface ComparisonColumn {
    key: string;
    label: string;
    runNumber: number;
    scenarioName: string;
    solverId: string;
    status: string;
}

export interface Comparison {
    metrics: MetricDefinition[];
    columns: ComparisonColumn[];
    cell: (metricId: string, columnKey: string) => ResultRow | undefined;
}

export interface ComparisonFilters {
    /** Metrics to show; all when undefined. */
    metricIds?: Set<string>;
    /** Scenario names to show; all when undefined. */
    scenarios?: Set<string>;
}

/**
 * LAB-MT-04, CF-03: every metric for every scenario run of the selected runs,
 * in one table. The run number is in the label only when several runs are compared.
 */
export function buildComparison(results: Results, filters: ComparisonFilters = {}): Comparison {
    const rows = results.rows.filter((row) => !filters.scenarios || filters.scenarios.has(row.scenarioName ?? ""));
    const severalRuns = new Set(rows.map((row) => row.runId)).size > 1;

    const columns: ComparisonColumn[] = [];
    rows.forEach((row) => {
        if (columns.some((column) => column.key === row.scenarioRunId)) return;
        columns.push({
            key: row.scenarioRunId,
            label: `${row.scenarioName ?? "Scenario"} · ${row.solverId}${severalRuns ? ` · run ${row.runNumber}` : ""}`,
            runNumber: row.runNumber,
            scenarioName: row.scenarioName ?? "Scenario",
            solverId: row.solverId,
            status: row.scenarioRunStatus,
        });
    });
    columns.sort((a, b) => a.runNumber - b.runNumber || a.scenarioName.localeCompare(b.scenarioName) || a.solverId.localeCompare(b.solverId));

    const byKey = new Map(rows.map((row) => [`${row.metricId}|${row.scenarioRunId}`, row]));
    return {
        metrics: results.metrics.filter((metric) => !filters.metricIds || filters.metricIds.has(metric.id)),
        columns,
        cell: (metricId, columnKey) => byKey.get(`${metricId}|${columnKey}`),
    };
}

export interface MetricSeries {
    /** Scenario and solver */
    name: string;
    points: { runNumber: number; value: number | null }[];
}

/** LAB-MT-04: one metric across runs, one series per scenario and solver. */
export function seriesAcrossRuns(results: Results, metricId: string): { runNumbers: number[]; series: MetricSeries[] } {
    const rows = results.rows.filter((row) => row.metricId === metricId);
    const runNumbers = [...new Set(rows.map((row) => row.runNumber))].sort((a, b) => a - b);
    const names = [...new Set(rows.map((row) => `${row.scenarioName ?? "Scenario"} · ${row.solverId}`))].sort();
    return {
        runNumbers,
        series: names.map((name) => ({
            name,
            points: runNumbers.map((runNumber) => ({
                runNumber,
                value: rows.find((row) => row.runNumber === runNumber && `${row.scenarioName ?? "Scenario"} · ${row.solverId}` === name)?.value ?? null,
            })),
        })),
    };
}
