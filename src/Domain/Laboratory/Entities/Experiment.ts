import { Metric } from "./Metric";
import { Scenario } from "./Scenario";
export class Experiment {
    id: string;
    name: string;
    description: string;
    hypothesis: string;
    userId: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    metrics: Metric[];
    customMetrics?: Metric[];
    labels?: string[];
    status?: "draft" | "ready" | "archived" | "deleted" | "running" | "completed" | "failed";
    scenarios?: Scenario[];
    constructor(id: string, 
        name: string, 
        description: string, 
        hypothesis: string, 
        scenarios: Scenario[] = [], 
        metrics: Metric[] = [], 
        userId: string, 
        customMetrics?: Metric[], 
        labels?: string[]
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.hypothesis = hypothesis;
        this.version = 1.0;
        this.status = "draft";
        this.scenarios = scenarios;
        this.userId = userId;
        this.labels = labels;
        this.metrics = metrics;
        this.customMetrics = customMetrics;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}