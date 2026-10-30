import { Badge, Button, Card, Form, Modal } from "react-bootstrap";
import { ExperimentHistory } from "../../../../Domain/Laboratory/Entities/ExperimentHistory";
import { format } from "date-fns/format";
import { useState } from "react";
import CompareVersionsModal from "./CompareVersionsModal/CompareVersionsModal";
import { getExperimentVersion } from "../../../../DataProvider/Services/experimentService";

type VersionHistoryModalProps = {
    show: boolean;
    onHide: () => void;
    versionHistory: ExperimentHistory[];
    handleRestore: (entry: ExperimentHistory) => void;
};

export default function VersionHistoryModal({ show, onHide, versionHistory, handleRestore }: VersionHistoryModalProps) {
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const currentVersion = Math.max(
    ...versionHistory.map((h) => h.experimentVersion)
    );

    const toggleVersionSelection = (version: number) => {
        setSelectedVersions((current) => {
            if (current.includes(version)) {
            return current.filter((v) => v !== version);
            }

            if (current.length >= 2) {
            return current;
            }

            return [...current, version];
        });
    };

    function getHistoryDescription( entry: ExperimentHistory ): string {
        switch (entry.eventType) {
            case "experiment_created":
            return "Experiment created";

            case "experiment_copied":
            return "Experiment copied";

            case "name_updated":
            return `Changed experiment name from "${entry.oldValue}" to "${entry.newValue}"`;

            case "description_updated":
            return "Updated description";

            case "hypothesis_updated":
            return "Updated hypothesis";

            case "project_updated":
            return "Moved to another project";

            case "labels_updated":
            return "Updated labels";

            case "metrics_updated":
            return "Updated metrics";

            case "scenario_added":
            return "Added a scenario";

            case "scenario_removed":
            return "Removed a scenario";

            case "scenario_model_updated":
            return "Changed scenario model";

            case "scenario_solver_config_updated":
            return "Updated scenario solver configuration";
            case "scenario_updated":
            return "Updated scenario name or operational context";
            case "status_changed":
            return `Status changed from ${entry.oldValue} to ${entry.newValue}`;
            case "experiment_archived":
            return "Experiment archived";
            case "experiment_restored":
            return "Experiment restored";
            case "experiment_deleted":
            return "Experiment deleted";
            case "version_restored":
            return `Restored version ${entry.newValue?.version}`;
            case "published_as_template":
            return "Published as a template";
            case "published_as_benchmark":
            return "Published as a benchmark";
            case "collaborator_shared":
            return `Shared as ${entry.newValue?.role}`;
            case "collaborator_removed":
            return "Removed a collaborator";
            case "run_started":
            return `Started run #${entry.newValue?.number}`;
            case "run_completed":
            return `Run #${entry.newValue?.number} completed`;
            case "run_failed":
            return `Run #${entry.newValue?.number} failed`;
            case "run_cancelled":
            return `Run #${entry.newValue?.number} cancelled`;
            case "experiment_reproduced":
            return `Rebuilt from the package of ${entry.newValue?.persistentId}`;

            default:
            return entry.eventType;
        }
    }
    
    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                size="lg"
            >
                <Modal.Header closeButton>
                        <div>
                            <Modal.Title>
                                Version History
                            </Modal.Title>
                            <div className="text-muted small mt-1">
                                Select two versions to compare or restore a previous version of the experiment.
                            </div>
                        </div>
                </Modal.Header>

                <Modal.Body>
                    {versionHistory.map((entry) => (
                    <Card
                        key={entry.id}
                        className="mb-2 border-0 shadow-sm"
                        style={{
                            borderRadius: "14px",
                        }}
                    >
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <Form.Check
                                type="checkbox"
                                checked={selectedVersions.includes(entry.experimentVersion)}
                                onChange={() => toggleVersionSelection(entry.experimentVersion)}
                                className="me-2"
                                aria-label={`Select version ${entry.experimentVersion} to compare`}
                            />
                            <div
                                className="d-flex align-items-center justify-content-center border rounded-circle"
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                }}
                            >
                                v{entry.experimentVersion}
                            </div>

                            <div>
                            <div className="d-flex align-items-center gap-2">
                                <div className="fw-semibold">
                                    Version {entry.experimentVersion}
                                </div>

                                {entry.experimentVersion === currentVersion && (
                                    <Badge bg="secondary">
                                    Current
                                    </Badge>
                                )}
                                </div>

                            <div className="text-muted">
                                {getHistoryDescription(entry)}
                            </div>

                            <div
                                className="text-muted small mt-1"
                                style={{ fontSize: "0.8rem" }}
                            >
                                {entry.userName} ·{" "}
                                {format(
                                new Date(entry.createdAt),
                                "dd/MM/yyyy HH:mm"
                                )}
                            </div>
                            </div>
                        </div>

                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleRestore(entry)}
                        >
                            Restore
                        </Button>
                        </div>
                    </Card.Body>
                    </Card>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    {selectedVersions.length >= 2 && (
                        <Button variant="info" onClick={() => setShowCompareModal(true)}>
                            Compare Versions
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onHide}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            {showCompareModal && (
                <CompareVersionsModal
                    show={showCompareModal}
                    onHide={() => setShowCompareModal(false)}
                    leftVersion={selectedVersions[0]}
                    rightVersion={selectedVersions[1]}
                    getExperimentVersion={getExperimentVersion}
                    experimentId={versionHistory[0].experimentId}
                />
            )}
        </>
    );
}
