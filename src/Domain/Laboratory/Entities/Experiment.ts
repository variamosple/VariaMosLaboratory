import { Metric } from "./Metric";
import { Scenario } from "./Scenario";
import { ExperimentRoleEnum } from "./Collaborator";

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
    status?: "draft" | "ready" | "archived" | "deleted" | "running" | "completed" | "failed";
    isTemplate?: boolean;
    isBenchmark?: boolean;

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