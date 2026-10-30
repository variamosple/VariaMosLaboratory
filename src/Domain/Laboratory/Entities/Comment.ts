/** LAB-COL-03: what a comment is about. */
export type CommentTargetType = "experiment" | "scenario" | "run" | "scenario_run";

export interface ExperimentComment {
    id: string;
    targetType: CommentTargetType;
    targetId: string;
    /** An annotation on one metric of a scenario run result. */
    metricId: string | null;
    targetLabel: string;
    /** Null once deleted. */
    body: string | null;
    author: string;
    authorName: string | null;
    createdAt: string | null;
    editedAt: string | null;
    deleted: boolean;
}
