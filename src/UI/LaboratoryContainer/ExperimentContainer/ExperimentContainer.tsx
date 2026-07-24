import { Experiment, ExperimentDetailed } from "@domain/Laboratory/Entities/Experiment";
import "./ExperimentContainer.css";
import { useEffect, useState, useCallback } from "react";
import { getExperimentDetailed, publishAsBenchmark, publishAsTemplate, getExperimentHistory, restoreExperimentVersion } from "../../../DataProvider/Services/experimentService";
import ExperimentHeader from "./ExperimentHeader/ExperimentHeader";
import ScenarioTabs from "./ScenarioTabs/ScenarioTabs";
import ExperimentSidebar from "./ExperimentSidebar/ExperimentSidebar";
import ExperimentCreationContainer from "../ExperimentCreationForm/ExperimentCreationForm";
import Modal from "react-bootstrap/Modal";
import { Button, } from "react-bootstrap";
import VersionHistoryModal from "./versionHistoryModal/versionHistoryModal";
import { ExperimentHistory } from "@domain/Laboratory/Entities/ExperimentHistory";
import CollaborationPanel from "../../Collaboration/Components/CollaborationPanel";
import { ExperimentRoleEnum } from "../../../Domain/Laboratory/Entities/Collaborator";

type ExperimentContainerProps = {
    experiment: Experiment;
    setExperiment: React.Dispatch<React.SetStateAction<Experiment>>;
    mode: "allowed" | "restricted";
}

export default function ExperimentContainer({experiment, setExperiment, mode}: ExperimentContainerProps) {
    const [detailedExperiment, setDetailedExperiment] = useState<ExperimentDetailed | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [currentMode, setMode] = useState<"allowed" | "restricted">(mode);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [versionHistory, setVersionHistory] = useState<ExperimentHistory[]>([]);

    const loadExperiment = useCallback(async (id: string) => {
        const result = await getExperimentDetailed(id);
        setDetailedExperiment(result);
        setExperiment(result);
    }, [setExperiment]);

    useEffect(() => {
        loadExperiment(experiment.id);
    }, [experiment.id, loadExperiment]);

    const handleRestore = async (entry: ExperimentHistory) => {
        await restoreExperimentVersion(
            experiment.id,
            entry.experimentVersion
        );

        await loadExperiment(experiment.id);

        const history = await getExperimentHistory(experiment.id);
        setVersionHistory(history);

        setShowVersionHistory(false);
    }

    useEffect(() => {
        if (showVersionHistory) {
            async function loadVersionHistory() {
                try {
                    const history = await getExperimentHistory(experiment.id);
                    setVersionHistory(history);
                }
                catch (error) {
                    console.error("Error fetching version history:", error);
                }
            }
            loadVersionHistory();
        }
    }, [showVersionHistory, experiment.id]);

    const handleEditExperiment = () => {
        setIsEditing(true);
    }


    const handlePublish = async (type: "template" | "benchmark") => {
        try {
            if (type === "template") {
                await publishAsTemplate(experiment.id);
            } else {
                await publishAsBenchmark(experiment.id);
            }

            setShowPublishModal(false);
            setMode("restricted");

        } catch (error: any) {
            console.error("Publish error:", error);

            const message =
                error.response?.data?.message ??
                "An error occurred while publishing the experiment.";

            alert(message);
        }
    };


    if (!detailedExperiment) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <ExperimentCreationContainer
                mode="edit"
                initialExperiment={detailedExperiment}
                onSuccess={async (updatedExperiment) => {
                    setExperiment(updatedExperiment);
                    setIsEditing(false);

                    const refreshed = await getExperimentDetailed(updatedExperiment.id);
                    setDetailedExperiment(refreshed);
                }}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    return (
        <>
            <div className="p-4">
                <ExperimentHeader
                    experiment={experiment}
                    onBack={() => setExperiment(null)}
                    mode={currentMode}
                    onPublishTemplate={() =>setShowPublishModal(true)}
                    onVersionHistory={() => setShowVersionHistory(true)}
                />
                <div className="d-flex gap-4">
                    <ScenarioTabs
                        scenarios={detailedExperiment.scenarios}
                    />
                    <ExperimentSidebar
                        experiment={experiment}
                        detailedExperiment={detailedExperiment}
                        onEditExperiment={handleEditExperiment}
                        mode={currentMode}
                    />
                </div>
                { (experiment.userRole === ExperimentRoleEnum.OWNER || experiment.userRole === ExperimentRoleEnum.DIRECTOR) && (
                    <CollaborationPanel experiment={detailedExperiment} />
                )}
            </div>
            {showVersionHistory && (
                <VersionHistoryModal
                    show={showVersionHistory}
                    onHide={() => setShowVersionHistory(false)}
                    versionHistory={versionHistory}
                    handleRestore={(entry) => { handleRestore(entry); setShowVersionHistory(false); }}
                />
            )}
            {showPublishModal && (
                <Modal show={showPublishModal} onHide={() => setShowPublishModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Publish Experiment</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <p>
                            Choose how you want to publish this experiment:
                        </p>

                        <div className="d-grid gap-3">
                            <Button
                                variant="outline-primary"
                                size="lg"
                                className="text-start p-3"
                                onClick={() => handlePublish("template")}
                            >
                                <div>
                                    <h5 className="mb-2">
                                        Experiment Template
                                    </h5>
                                    <div className="small">
                                        Publish this experiment as a reusable template.
                                        Other users will be able to create new experiments
                                        based on this structure.
                                    </div>
                                </div>
                            </Button>

                            <Button
                                variant="outline-success"
                                size="lg"
                                className="text-start p-3"
                                onClick={() => handlePublish("benchmark")}
                            >
                                <div>
                                    <h5 className="mb-2">
                                        Benchmark
                                    </h5>
                                    <div className="small">
                                        Publish this experiment as a benchmark.
                                        Other users will be able to execute their own
                                        models using the same scenarios and metrics.
                                    </div>
                                </div>
                            </Button>
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowPublishModal(false)}
                        >
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
}