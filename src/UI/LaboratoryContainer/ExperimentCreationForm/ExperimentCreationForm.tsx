import { useState } from "react";
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
import { Metric } from "@domain/Laboratory/Entities/Metric";
import { ExperimentRoleEnum } from "../../../Domain/Laboratory/Entities/Collaborator";

type ExperimentCreationFormProps = {
    mode: "create" | "edit";
    initialExperiment?: ExperimentDetailed;
    onSuccess: (experiment: Experiment) => void;
    onCancel: () => void;
}

export default function ExperimentCreationForm({ mode, initialExperiment, onSuccess, onCancel }: ExperimentCreationFormProps) {
    console.log("Initial experiment:", initialExperiment);
    const [experimentName, setExperimentName] = useState( initialExperiment?.name ?? "");
    const [experimentDescription, setExperimentDescription] = useState( initialExperiment?.description ?? "");
    const [experimentHypothesis, setExperimentHypothesis] = useState( initialExperiment?.hypothesis ?? "");
    const [scenarios, setScenarios] = useState<Scenario[]>(initialExperiment?.scenarios ?? [new Scenario(crypto.randomUUID())]);
    const [isTemplateImporting, setIsTemplateImporting] = useState(false);
    const [metrics, setMetrics] = useState<Metric[]>(initialExperiment?.metrics ?? []);
    const [labels, setLabels] = useState<string[]>(initialExperiment?.labels ?? []);;
    const [nameError, setNameError] = useState(false);

    const handleCreateExperiment = async () => {
        if (!experimentName.trim()) {
            setNameError(true);
            return;
        }

        setNameError(false);
        let experiment: ExperimentDetailed;
        
        
        if (mode === "edit") {
            experiment = {
                ...initialExperiment,
                name: experimentName,
                description: experimentDescription,
                hypothesis: experimentHypothesis,
                scenarios,
                metrics,
                labels
            };
            await updateExperiment(experiment);
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
            await createExperiment(experiment);
        }
        onSuccess(experiment);
    };

    return (
        <>
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">

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