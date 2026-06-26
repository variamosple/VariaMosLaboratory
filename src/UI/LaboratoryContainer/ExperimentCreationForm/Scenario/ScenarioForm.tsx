import { Tab, Nav } from "react-bootstrap";
import { Scenario } from "../../../../Domain/Laboratory/Entities/Scenario";
import { useState } from "react";
import ScenarioTabContent from "./ScenarioTabContent";
import ConfirmationModal from "../../../ConfirmationModal";
import "./ScenarioForm.css";

type ScenarioFormProps = {
    scenarios: Scenario[];
    setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
};

export default function ScenarioForm({scenarios, setScenarios}: ScenarioFormProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState(
        scenarios[0]?.id ?? ""
    );

    const addScenario = () => {
        const newScenario = new Scenario(crypto.randomUUID());

        setScenarios(prev => [...prev, newScenario]);
        setActiveTab(newScenario.id);
    };

    const askDeleteScenario = (scenario: Scenario) => {
        const isNotEmpty = scenario.model !== null || scenario.solver_config !== null;

        if (isNotEmpty) {
            setScenarioToDelete(scenario.id);
            setShowDeleteModal(true);
            return;
        }

        removeScenario(scenario.id);
    };

    const removeScenario = (scenarioId: string) => {
        const index = scenarios.findIndex((s) => s.id === scenarioId);
        const updatedScenarios = scenarios.filter((s) => s.id !== scenarioId);

        setScenarios(updatedScenarios);

        if (activeTab === scenarioId) {
            if (updatedScenarios.length === 0) {
                setActiveTab("");
                return;
            }
            const nextIndex = Math.min(index,updatedScenarios.length - 1);
            setActiveTab(updatedScenarios[nextIndex].id);
        }
    };

    return (
        <div>
        <Tab.Container activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
            <Nav variant="tabs">
                {scenarios.map((scenario, index) => (
                    <Nav.Item key={scenario.id}>
                        <Nav.Link eventKey={scenario.id} className="d-flex align-items-center gap-2">
                            <span>
                                Scenario {index + 1}
                            </span>

                            {scenarios.length > 1 && (
                                <span
                                    role="button"
                                    style={{ cursor: "pointer", fontWeight: "bold" }}
                                    onClick={(e) => { e.stopPropagation(); askDeleteScenario(scenario); }}
                                >
                                    ×
                                </span>
                            )}
                        </Nav.Link>
                    </Nav.Item>
                ))}

                <Nav.Item>
                    <button
                        type="button"
                        className="nav-link bg-transparent add-scenario-button"
                        onClick={addScenario}
                    >
                        + add scenario
                    </button>
                </Nav.Item>
            </Nav>

            <Tab.Content className="mt-3">
                {scenarios.map((scenario) => (
                    <Tab.Pane key={scenario.id} eventKey={scenario.id}>
                        <ScenarioTabContent
                            scenario={scenario}
                            updateScenario={(updatedScenario: Scenario) => {
                                setScenarios(prev => prev.map((s) => s.id === updatedScenario.id ? updatedScenario: s));
                                console.log("Updated scenario:", updatedScenario);
                            }}
                        />
                    </Tab.Pane>
                    ))}
            </Tab.Content>
        </Tab.Container>

        <ConfirmationModal
            show={showDeleteModal}
            confirmButtonVariant="primary"
            message="Are you sure you want to delete this scenario?"
            onConfirm={() => {
                if (scenarioToDelete) {
                    removeScenario(scenarioToDelete);
                }

                setShowDeleteModal(false);
                setScenarioToDelete(null);
            }}
            onCancel={() => {
                setShowDeleteModal(false);
                setScenarioToDelete(null);
            }}
        />
        </div>
    );
}