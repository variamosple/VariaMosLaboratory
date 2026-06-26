import { Metric } from "../../../../../../Domain/Laboratory/Entities/Metric";
import "./MetricCard.css";
type MetricCardProps = {
    metric: Metric;
    selected?: boolean;
    onClick?: () => void;
};

export default function MetricCard({ metric, selected = false, onClick }: MetricCardProps) {
    return (
        <div
            className={`metric-card ${selected ? "selected" : ""}`}
            onClick={onClick}
        >
            <div className="metric-card-header">
                <h6 className="mb-1">{metric.name}</h6>
                <span className="text-muted">{metric.unit}</span>
            </div>

            {metric.description && (
                <p className="text-muted small mb-2 metric-description">
                    {metric.description}
                </p>
            )}

            <code className="metric-formula">
                {metric.formula}
            </code>
        </div>
    );
}