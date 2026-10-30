import { OperationalContext } from "./Scenario";
import { MetricDefinition, MetricValue } from "./Results";

/** LAB-RUN-03 states of a run and of each scenario run. */
export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export const isActiveRun = (status: RunStatus) => status === "pending" || status === "running";

export type AttemptOutcome = "completed" | "failed" | "transient_error" | "cancelled" | "resource_limit";

/** LAB-RP-02: what was executed, frozen when the run started. */
export interface RunProvenance {
    experiment: { id: string; name: string; version: number; projectId: string | null };
    startedBy: string;
    laboratoryVersion: string;
    reasoning: { gateway: string };
    metrics: MetricDefinition[];
    scenarios: {
        scenarioId: string;
        name: string;
        models: { modelId: string; languageId: number | null; hash: string; pinnedAt: string | null; semanticsHash?: string | null }[];
        operationalContext: OperationalContext | null;
        solvers: { id: string; version: string; parameters: Record<string, unknown> }[];
    }[];
}

export interface RunAttempt {
    attempt: number;
    jobId: string | null;
    outcome: AttemptOutcome;
    error: string | null;
    startedAt: string;
    finishedAt: string;
}

/** One solver on one scenario (LAB-CF-03). */
export interface ScenarioRun {
    id: string;
    position: number;
    scenarioId: string;
    scenarioName: string | null;
    solverId: string;
    solverVersion: string;
    status: RunStatus;
    jobId: string | null;
    attempts: number;
    /** LAB-VIS-01: 0 to 1 while running. */
    progress: number | null;
    result: any;
    error: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    /** LAB-MT-03 */
    metrics: MetricValue[];
    attemptLog: RunAttempt[];
}

export interface Run {
    id: string;
    experimentId: string;
    number: number;
    experimentVersion: number;
    status: RunStatus;
    /** LAB-RP-03: VLAB-XXXX-XXXX-XXXX-XXXX once completed. */
    persistentId: string | null;
    startedBy: string;
    startedByName: string | null;
    failureReason: string | null;
    cancelledBy: string | null;
    cancelledByName: string | null;
    cancelledAt: string | null;
    createdAt: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    provenance: RunProvenance;
    scenarioRuns: ScenarioRun[];
}

/** LAB-RP-03: where a persistent id leads. */
export interface RunReference {
    persistentId: string;
    runId: string;
    runNumber: number;
    status: RunStatus;
    finishedAt: string | null;
    experimentId: string;
    experimentName: string;
    experimentVersion: number;
}

/** LAB-RP-04: runs side by side. */
export interface RunComparison {
    runs: {
        runId: string;
        persistentId: string | null;
        number: number;
        status: RunStatus;
        experiment: { id: string; name: string; version: number };
        finishedAt: string | null;
        configuration: Record<string, unknown>;
        results: Record<string, unknown>;
    }[];
    differences: { configuration: string[]; results: string[] };
    /** Same results in every run, timings apart. */
    equivalent: boolean;
}
