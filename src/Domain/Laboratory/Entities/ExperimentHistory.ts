export type ExperimentHistoryEventType =
    | "experiment_created"
    | "name_updated"
    | "description_updated"
    | "hypothesis_updated"
    | "project_updated"
    | "run_started"
    | "run_completed"
    | "run_failed"
    | "run_cancelled"
    | "experiment_reproduced"
    | "labels_updated"
    | "metrics_updated"
    | "scenario_added"
    | "scenario_removed"
    | "scenario_model_updated"
    | "scenario_solver_config_updated"
    | "scenario_updated"
    | "experiment_copied"
    | "status_changed"
    | "experiment_archived"
    | "experiment_restored"
    | "experiment_deleted"
    | "version_restored"
    | "published_as_template"
    | "published_as_benchmark"
    | "collaborator_shared"
    | "collaborator_removed";

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