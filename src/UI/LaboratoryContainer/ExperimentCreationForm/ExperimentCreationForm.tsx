import { useEffect, useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import { getExperimentDetailed } from "../../../DataProvider/Services/experimentService";
import { errorDetails } from "../../errorMessage";
import { Experiment, ExperimentDetailed } from "../../../Domain/Laboratory/Entities/Experiment";
import "./ExperimentCreationForm.css";
import CreateExperimentButton from "../../Buttons/CreateExperimentButton/CreateExperimentButton";
import CancelButton from "../../Buttons/CancelButton/CancelButton";
import TemplateButton from "../../Buttons/TemplateButton/TemplateButton";
import ExperimentInfoForm from "./ExperimentInfoForm/ExperimentInfoForm";
import { Scenario } from "../../../Domain/Laboratory/Entities/Scenario";
import ScenarioForm from "./Scenario/ScenarioForm";
import SelectTemplateModal from "./SelectTemplateModal/SelectTemplateModal";
import { createExperiment, updateExperiment } from "../../../DataProvider/Services/experimentService";
import * as alertify from "alertifyjs";
import { errorMessage } from "../../errorMessage";
import { Metric } from "@domain/Laboratory/Entities/Metric";
import { ExperimentRoleEnum } from "../../../Domain/Laboratory/Entities/Collaborator";
import { getUserProjects, ProjectSummary } from "../../../DataProvider/Services/userProjectsService";

type ExperimentCreationFormProps = {
    mode: "create" | "edit";
    initialExperiment?: ExperimentDetailed;
    /** LAB-EX-01: projects the experiment can belong to; loaded here when not given. */
    projects?: ProjectSummary[];
    defaultProjectId?: string;
    /** LAB-COL-02: a version saved by someone else while this form is open. */
    newerVersion?: { version: number; lines: string[] } | null;
    onSuccess: (experiment: Experiment) => void;
    onCancel: () => void;
}

export default function ExperimentCreationForm({ mode, initialExperiment, projects, defaultProjectId = "", newerVersion = null, onSuccess, onCancel }: ExperimentCreationFormProps) {
    const [experimentName, setExperimentName] = useState( initialExperiment?.name ?? "");
    const [experimentDescription, setExperimentDescription] = useState( initialExperiment?.description ?? "");
    const [experimentHypothesis, setExperimentHypothesis] = useState( initialExperiment?.hypothesis ?? "");
    const [scenarios, setScenarios] = useState<Scenario[]>(initialExperiment?.scenarios ?? [new Scenario(crypto.randomUUID())]);
    const [isTemplateImporting, setIsTemplateImporting] = useState(false);
    const [metrics, setMetrics] = useState<Metric[]>(initialExperiment?.metrics ?? []);
    const [labels, setLabels] = useState<string[]>(initialExperiment?.labels ?? []);;
    const [nameError, setNameError] = useState(false);
    const [projectId, setProjectId] = useState(initialExperiment?.projectId ?? defaultProjectId);
    const [projectError, setProjectError] = useState(false);
    const [loadedProjects, setLoadedProjects] = useState<ProjectSummary[]>([]);
    // LAB-COL-02: the save was refused, someone saved in between
    const [conflict, setConflict] = useState<{ message: string; details: string[]; experiment: ExperimentDetailed } | null>(null);

    useEffect(() => {
        if (projects) return;
        getUserProjects()
            .then(setLoadedProjects)
            .catch(() => setLoadedProjects([]));
    }, [projects]);

    const handleCreateExperiment = async () => {
        const missingName = !experimentName.trim();
        const missingProject = !projectId;
        setNameError(missingName);
        setProjectError(missingProject);
        if (missingName || missingProject) {
            return;
        }

        let experiment: ExperimentDetailed;

        if (mode === "edit") {
            experiment = {
                ...initialExperiment,
                name: experimentName,
                description: experimentDescription,
                hypothesis: experimentHypothesis,
                projectId,
                scenarios,
                metrics,
                labels,
                // LAB-COL-02: the version this form started from
                expectedVersion: initialExperiment?.version,
            } as ExperimentDetailed;
        } else {
            experiment = new ExperimentDetailed(
                crypto.randomUUID(),
                experimentName,
                experimentDescription,
                experimentHypothesis,
                scenarios,
                metrics,
                labels,
                ExperimentRoleEnum.OWNER,
            );
            experiment.projectId = projectId;
        }

        try {
            // The server returns the saved experiment: its ids, version and state
            const saved = mode === "edit"
                ? await updateExperiment(experiment)
                : await createExperiment(experiment);
            onSuccess(saved);
        } catch (error: any) {
            if (mode === "edit" && error?.response?.status === 409 && errorDetails(error).length > 0) {
                setConflict({ message: errorMessage(error, "Someone saved a newer version."), details: errorDetails(error), experiment });
                return;
            }
            alertify.error(errorMessage(error, "The experiment could not be saved."));
        }
    };

    /** Saves this form over the newer version, knowingly. */
    const overwrite = async () => {
        if (!conflict || !initialExperiment) return;
        try {
            const latest = await getExperimentDetailed(initialExperiment.id);
            const saved = await updateExperiment({ ...conflict.experiment, expectedVersion: latest.version } as ExperimentDetailed);
            setConflict(null);
            onSuccess(saved);
        } catch (error) {
            setConflict(null);
            alertify.error(errorMessage(error, "The experiment could not be saved."));
        }
    };

    return (
        <>
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">

                    {newerVersion && (
                        <Alert variant="warning" role="status">
                            Version {newerVersion.version} was saved by another user while you edit. Saving will show you what changed.
                        </Alert>
                    )}

                    <div className="text-center mb-4">
                        <TemplateButton onClick={() => setIsTemplateImporting(true)} />
                    </div>

                    <ExperimentInfoForm
                        experimentName={experimentName}
                        setExperimentName={setExperimentName}
                        experimentDescription={experimentDescription}
                        setExperimentDescription={setExperimentDescription}
                        experimentHypothesis={experimentHypothesis}
                        setExperimentHypothesis={setExperimentHypothesis}
                        metrics={metrics}
                        setMetrics={setMetrics}
                        labels={labels}
                        setLabels={setLabels}
                        nameError={nameError}
                        setNameError={setNameError}
                        projects={projects ?? loadedProjects}
                        projectId={projectId}
                        setProjectId={(id) => {
                            setProjectId(id);
                            if (id) setProjectError(false);
                        }}
                        projectError={projectError}
                    />

                    <ScenarioForm scenarios={scenarios} setScenarios={setScenarios} />
                    
                    <div className="d-flex justify-content-end gap-3">
                        {mode === "edit" ? (
                            <button className="btn btn-primary" onClick={handleCreateExperiment}>
                                Save Changes
                            </button>
                        ) : (
                            <CreateExperimentButton onClick={handleCreateExperiment} />
                        )}
                        <CancelButton onClick={onCancel} />
                    </div>
                </div>
            </div>
        </div>
        {conflict && (
            <Modal show onHide={() => setConflict(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Someone saved a newer version</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{conflict.message}</p>
                    <ul className="small">
                        {conflict.details.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                    <p className="small text-muted mb-0">Your changes are not saved yet.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => { setConflict(null); onCancel(); }}>Discard mine, see theirs</Button>
                    <Button variant="warning" onClick={overwrite}>Save mine over theirs</Button>
                </Modal.Footer>
            </Modal>
        )}
        {isTemplateImporting && (
            <SelectTemplateModal 
                show={isTemplateImporting} 
                onClose={() => setIsTemplateImporting(false)} 
                onTemplateSelected={(template) => {
                    // Handle template selection
                }}
            />
        )}
    </>
    );
}