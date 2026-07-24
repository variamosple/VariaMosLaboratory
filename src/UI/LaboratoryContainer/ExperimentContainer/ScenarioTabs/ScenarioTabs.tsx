import { useMemo, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Scenario } from "@domain/Laboratory/Entities/Scenario";
import MxGEditor from "../../../MxGEditor/MxGEditor";

type ScenarioTabsProps = {
    scenarios: Scenario[];
};

export default function ScenarioTabs({ scenarios }: ScenarioTabsProps) {
    const [activeTab, setActiveTab] = useState(scenarios[0]?.id);

    const activeScenario = useMemo(
        () => scenarios.find((s) => s.id === activeTab) ?? scenarios[0],
        [scenarios, activeTab]
    );

    return (
        <div>
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                className="mb-3"
            >
                {scenarios.map((scenario, index) => (
                    <Tab
                        key={scenario.id}
                        eventKey={scenario.id}
                        title={`Scenario ${index + 1}`}
                    >
                        {/* vide */}
                    </Tab>
                ))}
            </Tabs>

            {activeScenario?.model && (
                <div className="border rounded p-3 overflow-hidden">
                    <MxGEditor model={activeScenario.model} />
                </div>
            )}
        </div>
    );
}