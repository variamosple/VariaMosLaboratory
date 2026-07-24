import { Button } from "react-bootstrap";

type ExecutionCardProps = {
    onRunExperiment?: () => void;
    onScheduleExperiment?: () => void;
};

export default function ExecutionCard({ onRunExperiment, onScheduleExperiment }: ExecutionCardProps) {
    return (
        <div className="experiment-card mb-3">
            <h5 className="mb-5">Execution</h5>

            <Button
                variant="success"
                className="w-100 mb-2"
                onClick={onRunExperiment}
            >
                Run Experiment
            </Button>

            <Button
                variant="outline-secondary"
                className="w-100"
                onClick={onScheduleExperiment}
            >
                Schedule Experiment
            </Button>
        </div>
    );
}