import { Experiment } from "@domain/Laboratory/Entities/Experiment";
import { Button, Tabs, Tab } from "react-bootstrap";
import { ArrowLeft, ClockHistory, Hourglass, GraphUp, FileEarmarkArrowUp } from "react-bootstrap-icons";
import "./ExperimentContainer.css";
import { useEffect, useMemo, useState } from "react";
import { getExperiment, getExperimentAuthor } from "../../../DataProvider/Services/experimentService";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import MxGEditor from "../../MxGEditor/MxGEditor";
type ExperimentContainerProps = {
    experiment: Experiment;
    setExperiment: React.Dispatch<React.SetStateAction<Experiment>>;
}

export default function ExperimentsContainer({experiment, setExperiment}: ExperimentContainerProps) {
    const [activeTab, setActiveTab] = useState(experiment.scenarios[0]?.id);
    const [author, setAuthor] = useState<string>("");
    const [model, setModel] = useState(experiment.scenarios[0]?.model || null);
    console.log("Model in experiment:", experiment.scenarios.flatMap(s => s.model));
    useEffect(() => {
        async function loadAuthor() {
            const result = await getExperimentAuthor(experiment.id);
            setAuthor(result);
        }

        loadAuthor();
    }, [experiment.id]);
    
    function formatTimeAgo(date: Date) {
        return formatDistanceToNow(date, { addSuffix: true });
    }

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="primary" onClick={() => {setExperiment(null)}}>
                    <ArrowLeft className="me-2" />
                    Back
                </Button>
                <h3 className="mb-0">{experiment.name}</h3>
                <div>
                    <Button variant="outline-primary" className="me-2">
                        <ClockHistory className="me-2" />
                        Version History
                    </Button>
                    <Button variant="outline-primary">
                        <Hourglass className="me-2" />
                        Run History
                    </Button>
                    <Button variant="outline-primary" className="ms-2">
                        <GraphUp className="me-2" />
                        Dashboard
                    </Button>
                    <Button variant="outline-primary" className="ms-2">
                        <FileEarmarkArrowUp className="me-2" />
                        Publish as Template
                    </Button>
                </div>
            </div>
            <div className="d-flex gap-4">
                <div className="experiment-content">
                    <Tabs activeKey={activeTab} className="mb-3" onSelect={(k) => setActiveTab(k)}>
                        {experiment.scenarios.map((scenario) => (
                            <Tab
                                key={scenario.id}
                                eventKey={scenario.id}
                                title={"Scenario " + (experiment.scenarios.indexOf(scenario) + 1)}
                            >
                            </Tab>
                        ))}
                    </Tabs>
                    <div className="border rounded p-3 overflow-hidden">
                        <MxGEditor model={model} />
                    </div>
                </div>
                <div className="experiment-side mt-5">
                    <div className="experiment-card mb-3">
                        <h5 className="mb-5">Execution</h5>
                        <Button variant="success" className="w-100 mb-2">Run Experiment</Button>
                        <Button variant="outline-secondary" className="w-100">Schedule Experiment</Button>
                    </div>
                    <div className="experiment-card">
                        <h5 className="mb-5">Details</h5>
                        <div className="mb-3 d-flex flex-row justify-content-between">
                            <p className="text-muted">State :</p>
                            <p>{experiment.status.toUpperCase()}</p>
                        </div>
                        <div className="mb-3 d-flex flex-row justify-content-between">
                            <p className="text-muted">Author :</p>
                            <p>{author}</p>
                        </div>
                        <div className="mb-3 d-flex flex-row justify-content-between">
                            <p className="text-muted">Created on :</p>
                            <p>{new Date(experiment.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="mb-3 d-flex flex-row justify-content-between">
                            <p className="text-muted">Last modified :</p>
                            <p>{formatTimeAgo(experiment.updatedAt)}</p>
                        </div>
                        <div className="border-top my-3"></div>
                        <div className="mb-3 d-flex flex-row justify-content-between">
                            <p className="text-muted">Metrics :</p>
                            <p className="badge bg-primary">{}</p>
                        </div>
                        <Button variant="outline-primary" className="w-100">Edit Experiment</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}