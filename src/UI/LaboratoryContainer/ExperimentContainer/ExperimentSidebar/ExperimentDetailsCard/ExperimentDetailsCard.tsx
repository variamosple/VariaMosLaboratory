import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { getUserProjects } from "../../../../../DataProvider/Services/userProjectsService";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
    Experiment,
    ExperimentDetailed,
} from "@domain/Laboratory/Entities/Experiment";

type ExperimentDetailsCardProps = {
    experiment: Experiment;
    detailedExperiment: ExperimentDetailed;
    onEditExperiment: () => void;
    canWrite: boolean;
};

export default function ExperimentDetailsCard({ experiment, detailedExperiment, onEditExperiment, canWrite }: ExperimentDetailsCardProps) {
    const status = detailedExperiment.status;
    // LAB-EX-03: running and archived experiments cannot be edited
    const canEdit = canWrite && status !== "running" && status !== "archived";
    const createsNewDraft = status === "ready" || status === "completed" || status === "failed" || status === "cancelled";
    const projectId = detailedExperiment.projectId;
    const [projectName, setProjectName] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) return;
        getUserProjects()
            .then((projects) => setProjectName(projects.find((project) => project.id === projectId)?.name ?? null))
            .catch(() => setProjectName(null));
    }, [projectId]);

    function formatTimeAgo(date: string) {
        const parsed = new Date(date);
        return formatDistanceToNow(parsed, { addSuffix: true });
    }

    return (
        <div className="experiment-card">
            <h5 className="mb-5">Details</h5>

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">State :</p>
                <p>{status?.replace("_", " ").toUpperCase()}</p>
            </div>

            <div className="mb-3 d-flex justify-content-between">
                <p className="text-muted">Project :</p>
                <p>{projectId ? projectName ?? projectId : "None"}</p>
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
            {detailedExperiment.clonedFrom && (
                <div className="mb-3 d-flex justify-content-between">
                    <p className="text-muted">Cloned from :</p>
                    <p>
                        {detailedExperiment.clonedFrom.name ? `${detailedExperiment.clonedFrom.name}, ` : ""}
                        version {detailedExperiment.clonedFrom.version ?? "?"}
                    </p>
                </div>
            )}
            {canEdit && (
                <>
                    <Button
                        variant="outline-primary"
                        className="w-100"
                        onClick={onEditExperiment}
                    >
                        Edit Experiment
                    </Button>
                    {createsNewDraft && (
                        <p className="small text-muted mt-2 mb-0">
                            Saving a change creates a new version and returns the experiment to Draft.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}