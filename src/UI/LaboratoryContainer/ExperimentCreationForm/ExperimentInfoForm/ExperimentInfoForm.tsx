import { useState } from "react";
import SelectButton from "../../../Buttons/SelectButton/SelectButton";
import SelectMetricModal from "./SelectMetricModal/SelectMetricModal";
import { Metric } from "@domain/Laboratory/Entities/Metric";
import { ProjectSummary } from "../../../../DataProvider/Services/userProjectsService";
import ProjectSelect from "../../../ProjectSelect/ProjectSelect";
type ExperimentInfoFormProps = {
    experimentName: string;
    setExperimentName: React.Dispatch<React.SetStateAction<string>>;
    experimentDescription: string;
    setExperimentDescription: React.Dispatch<React.SetStateAction<string>>;
    experimentHypothesis: string;
    setExperimentHypothesis: React.Dispatch<React.SetStateAction<string>>;
    metrics: Metric[];
    setMetrics: React.Dispatch<React.SetStateAction<Metric[]>>;    labels: string[];
    setLabels: React.Dispatch<React.SetStateAction<string[]>>;
    nameError: boolean;
    setNameError: React.Dispatch<React.SetStateAction<boolean>>;
    projects: ProjectSummary[];
    projectId: string;
    setProjectId: (projectId: string) => void;
    projectError: boolean;
};

export default function ExperimentInfoForm({ 
    experimentName, 
    setExperimentName, 
    experimentDescription, 
    setExperimentDescription, 
    experimentHypothesis, 
    setExperimentHypothesis,
    metrics,
    setMetrics,
    labels,
    setLabels,
    nameError,
    setNameError,
    projects,
    projectId,
    setProjectId,
    projectError
    }: ExperimentInfoFormProps) {

    const [showSelectMetricModal, setShowSelectMetricModal] = useState(false);
        return (
            <>
            <div className="mb-4">
                <div className="mb-4">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        className={`form-control ${nameError ? "is-invalid" : ""}`}
                        placeholder="Name of the experiment"
                        value={experimentName}
                        onChange={(e) => {
                            setExperimentName(e.target.value);
                            if (e.target.value.trim()) {
                                setNameError(false);
                            }
                        }}
                    />

                    {nameError && (
                        <div className="invalid-feedback">
                            The experiment name is required.
                        </div>
                    )}
                </div>

                {/* Project (LAB-EX-01) */}
                <div className="mb-4">
                    <label className="form-label" htmlFor="experiment-project">Project</label>
                    <ProjectSelect
                        id="experiment-project"
                        projects={projects}
                        value={projectId}
                        onChange={setProjectId}
                        invalid={projectError}
                    />
                    {projectError && (
                        <div className="invalid-feedback d-block">
                            The experiment must belong to a project.
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="form-label">Description</label>
                    <textarea
                        rows={5}
                        className="form-control"
                        placeholder="Description of the experiment"
                        value={experimentDescription}
                        onChange={(e) =>
                            setExperimentDescription(e.target.value)
                        }
                    />
                </div>

                {/* Hypothesis */}
                <div className="mb-4">
                    <label className="form-label">Hypothesis</label>
                    <textarea
                        rows={5}
                        className="form-control"
                        placeholder="Hypothesis of the experiment"
                        value={experimentHypothesis}
                        onChange={(e) =>
                            setExperimentHypothesis(e.target.value)
                        }
                    />
                </div>

                {/* Labels */}
                <div className="mb-4">
                    <label className="form-label">Labels</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: biology, chemistry, physics"
                        value={labels.join(", ")}
                        onChange={(e) => {
                            const value = e.target.value;
                            const parsedLabels = value
                                .split(",")
                                .map((label) => label.trim())
                                .filter((label) => label.length > 0);

                            setLabels(parsedLabels);
                        }}
                    />
                </div>

                {/* Metrics */}
                <div className="mb-4">
                    <label className="form-label">
                        Metrics
                    </label>
                    <SelectButton onClick={() => setShowSelectMetricModal(true)} label="Select metrics" content={metrics} />
                </div>
            </div>
            <SelectMetricModal
                show={showSelectMetricModal}
                onClose={() => {setShowSelectMetricModal(false);}}
                setSelectedMetrics={(metrics) => setMetrics(metrics)}
                selectedMetrics={metrics}
            />
        </>
    )
}