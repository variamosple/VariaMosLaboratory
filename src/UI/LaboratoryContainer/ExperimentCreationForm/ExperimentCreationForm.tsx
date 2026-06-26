import { useEffect, useState } from "react";
import { Experiment } from "../../../Domain/Laboratory/Entities/Experiment";
import { useSession } from "@variamosple/variamos-components/dist/Context/SessionContext";
import "./ExperimentCreationForm.css";
import CreateExperimentButton from "../../Buttons/CreateExperimentButton/CreateExperimentButton";
import CancelButton from "../../Buttons/CancelButton/CancelButton";
import TemplateButton from "../../Buttons/TemplateButton/TemplateButton";
import ExperimentInfoForm from "./ExperimentInfoForm/ExperimentInfoForm";
import { Scenario } from "../../../Domain/Laboratory/Entities/Scenario";
import ScenarioForm from "./Scenario/ScenarioForm";
import SelectTemplateModal from "./SelectTemplateModal/SelectTemplateModal";
import { Metric } from "@domain/Laboratory/Entities/Metric";

type ExperimentCreationFormProps = {
    onExperimentCreated: (experiment: Experiment) => void;
    onCancel: () => void;
}

export default function ExperimentCreationForm({ onExperimentCreated, onCancel }: ExperimentCreationFormProps) {
    const { user } = useSession();

    const [experimentName, setExperimentName] = useState("");
    const [experimentDescription, setExperimentDescription] = useState("");
    const [experimentHypothesis, setExperimentHypothesis] = useState("");
    const [scenarios, setScenarios] = useState<Scenario[]>([new Scenario(crypto.randomUUID())]);
    const [isTemplateImporting, setIsTemplateImporting] = useState(false);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [customMetrics, setCustomMetrics] = useState<Metric[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [userId, setUserId] = useState("");

    useEffect(() => {
        setUserId(user.id);
    }, [user]);

    const handleCreateExperiment = () => {
        const experiment = new Experiment(
            crypto.randomUUID(),
            experimentName,
            experimentDescription,
            experimentHypothesis,
            scenarios,
            userId,
            metrics,
            customMetrics,
            labels
        );
        console.log("Experiment to be created:", experiment);
        onExperimentCreated(experiment);
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
                        customMetrics={customMetrics}
                        setCustomMetrics={setCustomMetrics}
                        labels={labels}
                        setLabels={setLabels}
                    />

                    <ScenarioForm scenarios={scenarios} setScenarios={setScenarios} />
                    
                    <div className="d-flex justify-content-end gap-3">
                        <CreateExperimentButton onClick={handleCreateExperiment} />
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