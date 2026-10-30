import { useEffect, useMemo, useState } from "react";
import { Badge, Form, Tab, Tabs } from "react-bootstrap";
import { Scenario } from "@domain/Laboratory/Entities/Scenario";
import { SolverDescriptor } from "@domain/Laboratory/Entities/SolverConfig";
import CommentThread from "../Comments/CommentThread";
import { getSolvers } from "../../../../DataProvider/Services/catalogService";
import MxGEditor from "../../../MxGEditor/MxGEditor";

type ScenarioTabsProps = {
    scenarios: Scenario[];
};

/** Read-only view of each scenario: models (and their pinned copy, with the semantics of their language), solvers, context, model graph. */
export default function ScenarioTabs({ scenarios }: ScenarioTabsProps) {
    const [activeTab, setActiveTab] = useState(scenarios[0]?.id);
    const [shownModelId, setShownModelId] = useState<string | undefined>();
    const [solvers, setSolvers] = useState<SolverDescriptor[]>([]);

    useEffect(() => {
        getSolvers().then(setSolvers).catch(() => setSolvers([]));
    }, []);

    const activeScenario = useMemo(
        () => scenarios.find((s) => s.id === activeTab) ?? scenarios[0],
        [scenarios, activeTab]
    );

    const shownModel =
        activeScenario?.models.find((ref) => ref.modelId === shownModelId) ?? activeScenario?.models[0];

    const solverName = (id: string) => solvers.find((solver) => solver.id === id)?.name ?? id;
    const context = activeScenario?.operationalContext;

    return (
        <div className="flex-grow-1">
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => { if (k) { setActiveTab(k); setShownModelId(undefined); } }}
                className="mb-3"
            >
                {scenarios.map((scenario, index) => (
                    <Tab
                        key={scenario.id}
                        eventKey={scenario.id}
                        title={scenario.name?.trim() || `Scenario ${index + 1}`}
                    />
                ))}
            </Tabs>

            {activeScenario && (
                <div className="small mb-3">
                    <div className="mb-2">
                        <strong>Models: </strong>
                        {activeScenario.models.length === 0 && <span className="text-muted">none</span>}
                        {activeScenario.models.map((ref) => (
                            <span key={ref.modelId} className="me-3">
                                {ref.model?.name ?? ref.modelId}
                                {ref.pinned && (
                                    <Badge bg="secondary" className="ms-1" title={`Pinned copy, SHA-256 ${ref.pinned.hash}`}>
                                        pinned {ref.pinned.hash.slice(0, 8)}
                                    </Badge>
                                )}
                                {ref.pinned?.semanticsHash && (
                                    <Badge
                                        bg="light"
                                        text="dark"
                                        className="ms-1 border"
                                        title={`Semantics of language ${ref.pinned.languageId} pinned with the model, SHA-256 ${ref.pinned.semanticsHash}`}
                                    >
                                        semantics {ref.pinned.semanticsHash.slice(0, 8)}
                                    </Badge>
                                )}
                            </span>
                        ))}
                    </div>

                    <div className="mb-2">
                        <strong>Solvers: </strong>
                        {Object.keys(activeScenario.solverConfigs ?? {}).length === 0 && <span className="text-muted">none</span>}
                        {Object.entries(activeScenario.solverConfigs ?? {}).map(([id, settings]) => (
                            <div key={id} className="ms-3">
                                {solverName(id)} {settings.version ?? <span className="text-danger">no version</span>}
                                <span className="text-muted">
                                    {" — "}
                                    {Object.entries(settings)
                                        .filter(([name]) => name !== "version")
                                        .map(([name, value]) => `${name}: ${value}`)
                                        .join(", ")}
                                </span>
                            </div>
                        ))}
                    </div>

                    {context && (context.activeFeatures.length > 0 || context.inactiveFeatures.length > 0 || context.extraConstraints) && (
                        <div className="mb-2">
                            <strong>Operational context: </strong>
                            on: {context.activeFeatures.join(", ") || "none"}; off: {context.inactiveFeatures.join(", ") || "none"}
                            {context.extraConstraints && <pre className="bg-light border rounded p-2 mt-1 mb-0">{context.extraConstraints}</pre>}
                        </div>
                    )}
                    {/* LAB-COL-03 */}
                    <CommentThread targetType="scenario" targetId={activeScenario.id} title={`scenario ${activeScenario.name || ""}`.trim()} />
                </div>
            )}

            {activeScenario && activeScenario.models.length > 1 && (
                <Form.Select
                    size="sm"
                    className="mb-2 w-auto"
                    value={shownModel?.modelId}
                    onChange={(e) => setShownModelId(e.target.value)}
                >
                    {activeScenario.models.map((ref) => (
                        <option key={ref.modelId} value={ref.modelId}>{ref.model?.name ?? ref.modelId}</option>
                    ))}
                </Form.Select>
            )}

            {shownModel?.model && (
                <div className="border rounded p-3 overflow-hidden">
                    <MxGEditor key={shownModel.modelId} model={shownModel.model} />
                </div>
            )}
        </div>
    );
}
