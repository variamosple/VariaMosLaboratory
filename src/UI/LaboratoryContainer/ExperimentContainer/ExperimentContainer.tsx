import { Experiment, ExperimentDetailed } from "@domain/Laboratory/Entities/Experiment";
import "./ExperimentContainer.css";
import { useEffect, useState, useCallback } from "react";
import { getExperimentDetailed, publishAsBenchmark, publishAsTemplate, getExperimentHistory, restoreExperimentVersion, markExperimentReady } from "../../../DataProvider/Services/experimentService";
import * as alertify from "alertifyjs";
import { errorDetails, errorMessage } from "../../errorMessage";
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
import { Run } from "../../../Domain/Laboratory/Entities/Run";
import { cancelRun, startRun } from "../../../DataProvider/Services/runService";
import RunsPanel from "./RunsPanel/RunsPanel";
import { useRuns } from "./RunsPanel/useRuns";
import ResultsPanel from "./Results/ResultsPanel";
import { CommentsProvider } from "./Comments/CommentsContext";
import DiscussionPanel from "./Comments/DiscussionPanel";
import { Alert } from "react-bootstrap";

type ExperimentContainerProps = {
    experiment: Experiment;
    setExperiment: React.Dispatch<React.SetStateAction<Experiment>>;
    mode: "allowed" | "restricted";
    /** LAB-RP-03: the run a permanent link points to, shown open. */
    focusRunId?: string | null;
}

export default function ExperimentContainer({experiment, setExperiment, mode, focusRunId = null}: ExperimentContainerProps) {
    const [detailedExperiment, setDetailedExperiment] = useState<ExperimentDetailed | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [currentMode, setMode] = useState<"allowed" | "restricted">(mode);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [versionHistory, setVersionHistory] = useState<ExperimentHistory[]>([]);
    const [readyProblems, setReadyProblems] = useState<string[]>([]);
    const [isMarkingReady, setMarkingReady] = useState(false);
    const [isStartingRun, setStartingRun] = useState(false);
    const [isCancellingRun, setCancellingRun] = useState(false);
    const [resultsTab, setResultsTab] = useState("dashboard");
    // LAB-COL-02: a version saved by someone else while this page is open
    const [remoteChange, setRemoteChange] = useState<{ version: number; lines: string[] } | null>(null);

    const loadExperiment = useCallback(async (id: string) => {
        const result = await getExperimentDetailed(id);
        setDetailedExperiment(result);
        setExperiment(result);
    }, [setExperiment]);

    useEffect(() => {
        loadExperiment(experiment.id);
    }, [experiment.id, loadExperiment]);

    // LAB-RUN-03: the end of a run followed on this page is notified here
    const { runs, loaded: runsLoaded, reload: reloadRuns, activeRun } = useRuns(experiment.id, (run: Run) => {
        if (run.status === "completed") alertify.success(`Run #${run.number} completed`);
        else if (run.status === "failed") alertify.error(`Run #${run.number} failed: ${run.failureReason ?? "see its details"}`);
        loadExperiment(experiment.id);
    });

    const handleRun = async () => {
        setStartingRun(true);
        setReadyProblems([]);
        try {
            await startRun(experiment.id);
            await Promise.all([reloadRuns(), loadExperiment(experiment.id)]);
        } catch (error) {
            const problems = errorDetails(error);
            setReadyProblems(problems);
            if (problems.length === 0) {
                alertify.error(errorMessage(error, "The run could not start."));
            }
        } finally {
            setStartingRun(false);
        }
    };

    const handleCancelRun = async (run: Run) => {
        setCancellingRun(true);
        try {
            await cancelRun(experiment.id, run.id);
            alertify.warning(`Run #${run.number} cancelled`);
            await Promise.all([reloadRuns(), loadExperiment(experiment.id)]);
        } catch (error) {
            alertify.error(errorMessage(error, "The run could not be cancelled."));
        } finally {
            setCancellingRun(false);
        }
    };

    const handleMarkReady = async () => {
        setMarkingReady(true);
        setReadyProblems([]);
        try {
            const ready = await markExperimentReady(experiment.id);
            setDetailedExperiment(ready);
            setExperiment(ready);
            alertify.success("The experiment is ready to run");
        } catch (error) {
            const problems = errorDetails(error);
            setReadyProblems(problems);
            if (problems.length === 0) {
                alertify.error(errorMessage(error, "The experiment could not be marked as ready."));
            }
        } finally {
            setMarkingReady(false);
        }
    };

    const handleRestore = async (entry: ExperimentHistory) => {
        try {
            await restoreExperimentVersion(
                experiment.id,
                entry.experimentVersion
            );
        } catch (error) {
            alertify.error(errorMessage(error, "The version could not be restored."));
            return;
        }

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

    // LAB-COL-02: changes by other users become visible within 5 s; while
    // editing, the form is told instead of being replaced under the user
    const shownVersion = detailedExperiment?.version;
    useEffect(() => {
        if (shownVersion === undefined) return;
        const timer = setInterval(async () => {
            try {
                const latest = await getExperimentDetailed(experiment.id);
                if (latest.version <= shownVersion) return;
                const history = await getExperimentHistory(experiment.id);
                const lines = history
                    .filter((entry) => entry.experimentVersion > shownVersion)
                    .map((entry) => `${entry.userName ?? "Someone"}: ${entry.eventType.replace(/_/g, " ")}`);
                setRemoteChange({ version: latest.version, lines });
                if (!isEditing) {
                    setDetailedExperiment(latest);
                    setExperiment(latest);
                }
            } catch {
                // the next tick tries again
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [experiment.id, shownVersion, isEditing, setExperiment]);


    const handlePublish = async (type: "template" | "benchmark") => {
        try {
            if (type === "template") {
                await publishAsTemplate(experiment.id);
            } else {
                await publishAsBenchmark(experiment.id);
            }

            setShowPublishModal(false);
            setMode("restricted");

        } catch (error) {
            alertify.error(errorMessage(error, "An error occurred while publishing the experiment."));
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
                newerVersion={remoteChange && remoteChange.version > detailedExperiment.version ? remoteChange : null}
                onSuccess={async (updatedExperiment) => {
                    setExperiment(updatedExperiment);
                    setIsEditing(false);
                    setReadyProblems([]);
                    setRemoteChange(null);

                    const refreshed = await getExperimentDetailed(updatedExperiment.id);
                    setDetailedExperiment(refreshed);
                }}
                onCancel={async () => {
                    setIsEditing(false);
                    setRemoteChange(null);
                    await loadExperiment(experiment.id);
                }}
            />
        );
    }

    return (
        <CommentsProvider experimentId={experiment.id} canModerate={!!detailedExperiment.permissions?.manage}>
            <div className="p-4">
                {remoteChange && !isEditing && (
                    <Alert variant="info" dismissible onClose={() => setRemoteChange(null)} role="status" aria-label="Changed by another user">
                        <strong>Version {remoteChange.version} was saved by another user; the page shows it.</strong>
                        <ul className="mb-0 small">
                            {remoteChange.lines.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                    </Alert>
                )}
                <ExperimentHeader
                    experiment={experiment}
                    onBack={() => setExperiment(null)}
                    mode={currentMode}
                    onPublishTemplate={() =>setShowPublishModal(true)}
                    onVersionHistory={() => setShowVersionHistory(true)}
                    onRunHistory={() => document.getElementById("runs-title")?.scrollIntoView({ behavior: "smooth" })}
                    onDashboard={() => {
                        setResultsTab("dashboard");
                        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
                    }}
                />
                <div className="d-flex gap-4">
                    <ScenarioTabs
                        scenarios={detailedExperiment.scenarios}
                    />
                    <ExperimentSidebar
                        experiment={experiment}
                        detailedExperiment={detailedExperiment}
                        onEditExperiment={handleEditExperiment}
                        onMarkReady={handleMarkReady}
                        readyProblems={readyProblems}
                        isMarkingReady={isMarkingReady}
                        mode={currentMode}
                        activeRun={activeRun}
                        onRun={handleRun}
                        onCancelRun={handleCancelRun}
                        isStartingRun={isStartingRun}
                        isCancellingRun={isCancellingRun}
                    />
                </div>
                <RunsPanel experimentId={experiment.id} runs={runs} loaded={runsLoaded} initialOpenRunId={focusRunId} />
                <ResultsPanel experimentId={experiment.id} runs={runs} tab={resultsTab} onTabChange={setResultsTab} />
                <DiscussionPanel experimentId={experiment.id} />
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
        </CommentsProvider>
    );
}