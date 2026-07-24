export type ExperimentHistoryEventType =
    | "experiment_created"
    | "name_updated"
    | "description_updated"
    | "hypothesis_updated"
    | "labels_updated"
    | "metrics_updated"
    | "scenario_added"
    | "scenario_removed"
    | "scenario_model_updated"
    | "scenario_solver_config_updated"
    | "experiment_copied";

export type ExperimentHistory = {
    id: string;
    experimentId: string;
    scenarioId?: string;
    userName: string;

    experimentVersion: number;

    eventType: ExperimentHistoryEventType;

    oldValue?: any;
    newValue?: any;

    createdAt: Date;
}