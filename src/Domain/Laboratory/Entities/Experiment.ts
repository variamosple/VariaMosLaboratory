import { Metric } from "./Metric";
import { Scenario } from "./Scenario";
import { ExperimentRoleEnum } from "./Collaborator";

/** LAB-EX-07 states, plus 'request_changes' from LAB-EX-03. */
export type ExperimentStatus =
    | "draft"
    | "request_changes"
    | "ready"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | "archived"
    | "deleted";

export class Experiment {
    id: string;
    name: string;
    description: string;
    hypothesis: string;
    version: number;
    userRole: string;
    createdAt: string;
    updatedAt: string;
    labels?: string[];
    status?: ExperimentStatus;
    isTemplate?: boolean;
    isBenchmark?: boolean;
    /** LAB-EX-01: the VariaMos project; null for experiments created before projects were recorded. */
    projectId?: string | null;
    /** LAB-EX-02: the experiment and version this one was cloned from; the name when the user can read it. */
    clonedFrom?: { experimentId: string; version: number | null; name?: string | null };
    /** LAB-RP-01: the run, by persistent id, whose package rebuilt this experiment. */
    reproducedFrom?: string | null;
    /** LAB-COL-01: what the user may do. */
    permissions?: { read: boolean; write: boolean; execute: boolean; manage: boolean };
    /** LAB-COL-04: the researcher who created it. */
    ownerName?: string | null;

    constructor(
        id: string, 
        name: string, 
        description: string, 
        hypothesis: string, 
        labels: string[] = [],
        userRole: ExperimentRoleEnum,
        isTemplate = false,
        isBenchmark = false,
        createdAt?: string,
        updatedAt?: string,
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.hypothesis = hypothesis;
        this.userRole = userRole;
        this.version = 1;
        this.status = "draft";
        this.labels = labels;
        this.createdAt = createdAt ?? new Date().toISOString();
        this.updatedAt = updatedAt ?? new Date().toISOString();
        this.isTemplate = isTemplate;
        this.isBenchmark = isBenchmark;
    }
}
export class ExperimentDetailed extends Experiment {
    scenarios: Scenario[];
    metrics: Metric[];
    author?: string;

    constructor(
        id: string,
        name: string,
        description: string,
        hypothesis: string,
        scenarios: Scenario[],
        metrics: Metric[],
        labels: string[] = [],
        userRole: ExperimentRoleEnum,
        isTemplate = false,
        isBenchmark = false,
        author?: string,
        createdAt?: string,
        updatedAt?: string,
    ) {
        super(
            id,
            name,
            description,
            hypothesis,
            labels,
            userRole,
            isTemplate,
            isBenchmark,
            createdAt,
            updatedAt
        );

        this.scenarios = scenarios;
        this.metrics = metrics;
        this.author = author;
    }
}