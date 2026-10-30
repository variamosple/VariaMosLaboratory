import { useState } from "react";
import { MetricDefinition } from "../../../../Domain/Laboratory/Entities/Results";
import { formatMetric, formatNumber } from "./format";

export interface MetricBarRow {
    label: string;
    value: number | null;
    note?: string | null;
    simulated?: boolean;
}

/**
 * One metric compared across scenario runs (LAB-MT-04). Metrics have different
 * units, so each gets its own small chart with its own zero-based scale.
 * From the simulated interface of the roadmap v0.3.
 */
export default function MetricBars({ metric, rows }: { metric: Pick<MetricDefinition, "code" | "name" | "unit">; rows: MetricBarRow[] }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const max = Math.max(0, ...rows.map((r) => r.value ?? 0));

    return (
        <figure className="lab-chart" aria-label={`${metric.name} by scenario run`}>
            <figcaption>
                <span className="lab-chart-title">
                    {metric.code && <span className="lab-code">{metric.code}</span>} {metric.name}
                </span>
                <span className="lab-chart-meta">{metric.unit}</span>
            </figcaption>
            <div className="lab-bars" role="list">
                {rows.map((row, i) => {
                    const width = row.value === null || max === 0 ? 0 : Math.max(0.5, (row.value / max) * 100);
                    return (
                        <div
                            key={row.label}
                            role="listitem"
                            aria-label={`${row.label}: ${row.value === null ? row.note ?? "no value" : formatMetric(row.value, metric)}`}
                            className={`lab-bar-row${hovered === i ? " is-hovered" : ""}`}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span className="lab-bar-label" title={row.label}>{row.label}</span>
                            <span className="lab-bar-track">
                                {row.value !== null && <span className="lab-bar" style={{ width: `${width}%` }} />}
                                <span className="lab-bar-value">
                                    {row.value === null ? <span className="text-muted" title={row.note ?? undefined}>n/a</span> : formatNumber(row.value)}
                                </span>
                            </span>
                            {hovered === i && (
                                <span className="lab-tooltip" role="tooltip">
                                    <strong>{row.label}</strong>
                                    <span>{metric.name}: {row.value === null ? row.note ?? "no value" : formatMetric(row.value, metric)}</span>
                                    {row.value !== null && max > 0 && <span className="text-muted">{Math.round((row.value / max) * 100)} % of the largest</span>}
                                    {row.simulated && <span className="text-muted">From a simulated Reasoning answer</span>}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </figure>
    );
}
