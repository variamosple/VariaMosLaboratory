import { Alert, Button } from "react-bootstrap";
import { ExperimentStatus } from "@domain/Laboratory/Entities/Experiment";
import { Run } from "../../../../../Domain/Laboratory/Entities/Run";
import { RunStatusBadge } from "../../RunsPanel/RunsPanel";

type ExecutionCardProps = {
    status?: ExperimentStatus;
    canWrite: boolean;
    /** LAB-COL-01: start and cancel runs */
    canExecute: boolean;
    onMarkReady: () => void;
    readyProblems: string[];
    isMarkingReady: boolean;
    activeRun: Run | null;
    onRun: () => void;
    onCancelRun: (run: Run) => void;
    isStartingRun: boolean;
    isCancellingRun: boolean;
};

/** LAB-RUN-01: a run starts from Ready; a finished experiment can run again. */
const canRun = (status?: ExperimentStatus) =>
    status === "ready" || status === "completed" || status === "failed" || status === "cancelled";

/**
 * LAB-EX-07, LAB-RUN-01, LAB-RUN-04: Draft -> Ready, then run and cancel.
 * Scheduling comes later (LAB-RUN-02, roadmap P6).
 */
export default function ExecutionCard({
    status,
    canWrite,
    canExecute,
    onMarkReady,
    readyProblems,
    isMarkingReady,
    activeRun,
    onRun,
    onCancelRun,
    isStartingRun,
    isCancellingRun,
}: ExecutionCardProps) {
    const canMarkReady = canWrite && (status === "draft" || status === "request_changes");

    return (
        <div className="experiment-card mb-3">
            <h5 className="mb-4">Execution</h5>

            {canMarkReady && (
                <Button
                    variant="primary"
                    className="w-100 mb-2"
                    onClick={onMarkReady}
                    disabled={isMarkingReady}
                >
                    Mark as Ready
                </Button>
            )}

            {readyProblems.length > 0 && (
                <Alert variant="warning" className="small">
                    <div className="fw-semibold mb-1">The experiment cannot run yet:</div>
                    <ul className="mb-0 ps-3">
                        {readyProblems.map((problem) => (
                            <li key={problem}>{problem}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {status === "ready" && (
                <p className="small text-muted">
                    The configuration is validated and each input model is pinned, with the semantics of its language, to the copy used by runs.
                </p>
            )}

            {activeRun ? (
                <>
                    <p className="small mb-2" role="status">
                        Run #{activeRun.number} <RunStatusBadge status={activeRun.status} />
                    </p>
                    {canExecute && (
                        <Button
                            variant="outline-danger"
                            className="w-100 mb-2"
                            onClick={() => onCancelRun(activeRun)}
                            disabled={isCancellingRun}
                        >
                            Cancel Run
                        </Button>
                    )}
                </>
            ) : (
                canExecute && (
                    <Button
                        variant="success"
                        className="w-100 mb-2"
                        onClick={onRun}
                        disabled={!canRun(status) || isStartingRun}
                    >
                        Run Experiment
                    </Button>
                )
            )}

            <Button variant="outline-secondary" className="w-100" disabled>
                Schedule Experiment
            </Button>

            <p className="small text-muted mt-2 mb-0">
                {status === "draft" || status === "request_changes"
                    ? "Mark the experiment Ready to run it. Scheduling is not available yet."
                    : "Scheduling is not available yet."}
            </p>
        </div>
    );
}
