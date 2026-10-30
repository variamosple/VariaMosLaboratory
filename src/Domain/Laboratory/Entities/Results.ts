/** A metric as frozen in the provenance of a run (LAB-MT-03). */
export interface MetricDefinition {
    id: string;
    code: string | null;
    name: string;
    unit: string | null;
    formula: string | null;
    requires: string | null;
}

/** A metric of a scenario run: a value, or the reason it could not be computed. */
export interface MetricValue {
    metricId: string;
    value: number | null;
    reason: string | null;
    inputs: Record<string, number>;
    /** An input came from a simulated Reasoning answer (mock gateway). */
    simulated: boolean;
}

/** LAB-MT-04: one metric of one scenario run. */
export interface ResultRow {
    runId: string;
    runNumber: number;
    runStatus: string;
    experimentVersion: number;
    scenarioRunId: string;
    scenarioId: string;
    scenarioName: string | null;
    solverId: string;
    solverVersion: string;
    scenarioRunStatus: string;
    metricId: string;
    metricCode: string | null;
    metricName: string;
    unit: string | null;
    value: number | null;
    reason: string | null;
    simulated: boolean;
}

export interface Results {
    metrics: MetricDefinition[];
    runs: { id: string; number: number; status: string; experimentVersion: number; startedAt: string | null; finishedAt: string | null }[];
    rows: ResultRow[];
}

/** LAB-MT-06 */
export interface SolverBenchmark {
    solverId: string;
    versions: string[];
    scenarioRuns: number;
    completed: number;
    failed: number;
    cancelled: number;
    successRate: number | null;
    responseTimeMs: { mean: number; median: number; min: number; max: number } | null;
    retries: number;
    agreementRate: number | null;
    compared: number;
}

export type ExportFormat = "csv" | "json" | "xlsx";
