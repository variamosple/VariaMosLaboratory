import { SolverConfigs } from "@domain/Laboratory/Entities/SolverConfig";
import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import SelectButton from "../../../Buttons/SelectButton/SelectButton";
import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import SelectModelModal from "./SelectModelModal/SelectModelModal";
import SolverContent from "./Solvers/SolverContent";
import { OperationalContext, Scenario, scenarioFeatures } from "../../../../Domain/Laboratory/Entities/Scenario";

type ScenarioTabContentProps = {
    scenario: Scenario;
    updateScenario: (updatedScenario: Scenario) => void;
}

const EMPTY_CONTEXT: OperationalContext = { activeFeatures: [], inactiveFeatures: [], extraConstraints: "" };

export default function ScenarioTabContent({ scenario, updateScenario }: ScenarioTabContentProps) {
    // Start from the saved configuration, so editing an experiment keeps its solvers
    const [solverConfigs, setSolverConfigs] = useState<SolverConfigs>(scenario.solverConfigs ?? {});
    const [showSelectModelModal, setShowSelectModelModal] = useState(false);

    // The parent passes a new scenario and callback on every render: depending on
    // them re-ran this effect after each of its own updates, in a loop.
    const latest = useRef({ scenario, updateScenario });
    latest.current = { scenario, updateScenario };

    const update = (changes: Partial<Scenario>) =>
        latest.current.updateScenario({ ...latest.current.scenario, ...changes });

    useEffect(() => {
        latest.current.updateScenario({
            ...latest.current.scenario,
            solverConfigs: solverConfigs,
        });
    }, [solverConfigs]);

    const models = scenario.models.map((ref) => ref.model).filter((model): model is Model => !!model);
    const context = scenario.operationalContext ?? EMPTY_CONTEXT;
    const features = scenarioFeatures(scenario).map((name) => ({ value: name, label: name }));
    const asOptions = (names: string[]) => names.map((name) => ({ value: name, label: name }));

    const setContext = (changes: Partial<OperationalContext>) =>
        update({ operationalContext: { ...context, ...changes } });

    // LAB-CF-01: one or more input models
    const setSelectedModels = (selected: Model[]) =>
        update({ models: selected.map((model) => ({ modelId: model.id, model })) });

    return (
        <>
            <div className="p-4">
                <div className="mb-4">
                    <label htmlFor={`scenario-name-${scenario.id}`} className="form-label">
                        Name
                    </label>
                    <input
                        id={`scenario-name-${scenario.id}`}
                        className="form-control"
                        placeholder="e.g. MiniZinc on the car model"
                        value={scenario.name ?? ""}
                        onChange={(e) => update({ name: e.target.value })}
                    />
                </div>

                {/* Models */}
                <div className="mb-4">
                    <label className="form-label">
                        Entry models
                    </label>
                    <SelectButton onClick={() => setShowSelectModelModal(true)} label="Select models" content={models} />
                </div>

                <SolverContent solverConfigs={solverConfigs} setSolverConfigs={setSolverConfigs} idPrefix={`scenario-${scenario.id}`} />

                {/* LAB-CF-04: operational context */}
                <div className="mb-2">
                    <label className="form-label">
                        Operational context
                    </label>
                    <p className="small text-muted mb-2">
                        Features forced on or off, and extra constraints, applied when the scenario runs.
                        {features.length === 0 && " Select a model to choose its features."}
                    </p>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label small" htmlFor={`active-${scenario.id}`}>Active features</label>
                            <Select
                                inputId={`active-${scenario.id}`}
                                isMulti
                                options={features.filter((option) => !context.inactiveFeatures.includes(option.value))}
                                value={asOptions(context.activeFeatures)}
                                onChange={(selected) => setContext({ activeFeatures: selected.map((option) => option.value) })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small" htmlFor={`inactive-${scenario.id}`}>Inactive features</label>
                            <Select
                                inputId={`inactive-${scenario.id}`}
                                isMulti
                                options={features.filter((option) => !context.activeFeatures.includes(option.value))}
                                value={asOptions(context.inactiveFeatures)}
                                onChange={(selected) => setContext({ inactiveFeatures: selected.map((option) => option.value) })}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label small" htmlFor={`constraints-${scenario.id}`}>Extra constraints</label>
                            <textarea
                                id={`constraints-${scenario.id}`}
                                className="form-control"
                                rows={3}
                                value={context.extraConstraints}
                                onChange={(e) => setContext({ extraConstraints: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <SelectModelModal
                show={showSelectModelModal}
                onClose={() => {setShowSelectModelModal(false);}}
                setSelectedModels={setSelectedModels}
                selectedModels={models}
            />
        </>
    );
}
