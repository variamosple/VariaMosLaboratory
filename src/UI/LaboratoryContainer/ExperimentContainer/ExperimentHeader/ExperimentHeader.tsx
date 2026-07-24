import { Button } from "react-bootstrap";
import { ArrowLeft, ClockHistory, Hourglass, GraphUp, FileEarmarkArrowUp } from "react-bootstrap-icons";
import { Experiment } from "@domain/Laboratory/Entities/Experiment";
import { ExperimentRoleEnum } from "../../../../Domain/Laboratory/Entities/Collaborator";

type ExperimentHeaderProps = {
    experiment: Experiment;
    onBack: () => void;
    onVersionHistory: () => void;
    onRunHistory?: () => void;
    onDashboard?: () => void;
    onPublishTemplate: () => void;
    mode: "allowed" | "restricted";
};

export default function ExperimentHeader({
    experiment,
    onBack,
    onVersionHistory,
    onRunHistory,
    onDashboard,
    onPublishTemplate,
    mode
}: ExperimentHeaderProps) {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <Button variant="primary" onClick={onBack}>
                <ArrowLeft className="me-2" />
                Back
            </Button>

            <h3 className="mb-0">{experiment.name}</h3>

            <div>
                <Button
                    variant="outline-primary"
                    className="me-2"
                    onClick={onVersionHistory}
                >
                    <ClockHistory className="me-2" />
                    Version History
                </Button>

                <Button
                    variant="outline-primary"
                    onClick={onRunHistory}
                >
                    <Hourglass className="me-2" />
                    Run History
                </Button>

                {(mode === "allowed") && (
                <>
                    <Button
                        variant="outline-primary"
                        className="ms-2"
                        onClick={onDashboard}
                    >
                        <GraphUp className="me-2" />
                        Dashboard
                    </Button>
                    { experiment.userRole !== ExperimentRoleEnum.EDITOR && (
                        <Button
                            variant="outline-primary"
                            className="ms-2"
                            onClick={onPublishTemplate}
                        >
                            <FileEarmarkArrowUp className="me-2" />
                            Publish as Template
                        </Button>
                    )}
                </>
                )}
            </div>
        </div>
    );
}