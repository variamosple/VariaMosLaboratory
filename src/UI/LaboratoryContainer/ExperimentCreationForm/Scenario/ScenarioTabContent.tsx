import { SolverConfigs } from "@domain/Laboratory/Entities/SolverConfig";
import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import SelectButton from "../../../Buttons/SelectButton/SelectButton";
import { useEffect, useState } from "react";
import SelectModelModal from "./SelectModelModal/SelectModelModal";
import SolverContent from "./Solvers/SolverContent";
import { Scenario } from "../../../../Domain/Laboratory/Entities/Scenario";

type ScenarioTabContentProps = {
    scenario: Scenario;
    updateScenario: (updatedScenario: Scenario) => void;
}

export default function ScenarioTabContent({ scenario, updateScenario }: ScenarioTabContentProps) {    
    const [model, setModel] = useState<Model | null>();
    const [solverConfigs, setSolverConfigs] = useState<SolverConfigs>({});
    const [showSelectModelModal, setShowSelectModelModal] = useState(false);

    useEffect(() => {
        updateScenario({
            ...scenario,
            model,
            solver_config: solverConfigs[scenario.id],
        });
        console.log("Model:", model);
        console.log("Solver Configs:", solverConfigs);
    }, [model, solverConfigs, scenario, updateScenario]);

    return (
        <>
            <div className="p-4">   
                {/* Models */}
                <div className="mb-4">
                    <label className="form-label">
                        Entry models
                    </label>
                    <SelectButton onClick={() => setShowSelectModelModal(true)} label="Select models" content={[model]} />
                </div>

                <SolverContent solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} />

            </div>

            <SelectModelModal
                show={showSelectModelModal}
                onClose={() => {setShowSelectModelModal(false);}}
                setSelectedModel={(model) => setModel(model)}
                selectedModel={model}
            />
        </>
    );
}