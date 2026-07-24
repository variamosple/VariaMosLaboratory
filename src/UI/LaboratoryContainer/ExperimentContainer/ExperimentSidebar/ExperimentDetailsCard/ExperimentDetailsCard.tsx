import { Button } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
    Experiment,
    ExperimentDetailed,
} from "@domain/Laboratory/Entities/Experiment";

type ExperimentDetailsCardProps = {
    experiment: Experiment;
    detailedExperiment: ExperimentDetailed;
    onEditExperiment: () => void;
    mode: "allowed" | "restricted";
};

export default function ExperimentDetailsCard({ experiment, detailedExperiment, onEditExperiment, mode }: ExperimentDetailsCardProps) {
    function formatTimeAgo(date: string) {
        const parsed = new Date(date);
        return formatDistanceToNow(parsed, { addSuffix: true });
    }

    return (
        <div className="experiment-card">
            <h5 className="mb-5">Details</h5>

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">State :</p>
                <p>{experiment.status.toUpperCase()}</p>
            </div>

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">Author :</p>
                <p>{detailedExperiment.author}</p>
            </div>

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">Created on :</p>
                <p>{new Date(experiment.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">Last modified :</p>
                <p>{formatTimeAgo(experiment.updatedAt)}</p>
            </div>

            <div className="border-top my-3" />

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">Metrics :</p>
                <p>{detailedExperiment.metrics.length}</p>
            </div>
            {(mode === "allowed") && (
                <Button
                    variant="outline-primary"
                    className="w-100"
                    onClick={onEditExperiment}
                >
                    Edit Experiment
                </Button>
            )}
        </div>
    );
}