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
                <h6 className="mb-1">
                    {metric.code && <span className="text-muted me-1">{metric.code}</span>}
                    {metric.name}
                </h6>
                <span className="text-muted">{metric.unit}</span>
            </div>

            {(metric.category || metric.formulaOrigin === "proposed") && (
                <div className="small mb-1">
                    {metric.category && <span className="badge bg-light text-dark me-1">{metric.category}</span>}
                    {metric.formulaOrigin === "proposed" && (
                        <span className="badge bg-warning text-dark" title="The specification names this metric without a formula">
                            proposed formula
                        </span>
                    )}
                </div>
            )}

            {metric.description && (
                <p className="text-muted small mb-2 metric-description">
                    {metric.description}
                </p>
            )}

            <code className="metric-formula">
                {metric.formula}
            </code>

            {metric.requires && (
                <div className="small text-muted mt-1">Needs: {metric.requires}</div>
            )}
        </div>
    );
}