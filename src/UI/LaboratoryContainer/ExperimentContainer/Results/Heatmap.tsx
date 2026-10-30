import { useState } from "react";
import { Comparison } from "./comparison";
import { formatMetric, formatNumber } from "./format";

/** White to VariaMos blue */
const shade = (t: number) => {
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    return `rgb(${mix(242, 66)}, ${mix(246, 141)}, ${mix(251, 207)})`;
};

/**
 * LAB-VIS-02: every metric (row) for every scenario run (column). Each row is
 * scaled on its own, since metrics have different units.
 */
export default function Heatmap({ comparison }: { comparison: Comparison }) {
    const [hover, setHover] = useState<string | null>(null);

    return (
        <div className="table-responsive">
            <table className="lab-heatmap" aria-label="Heatmap of the metrics">
                <thead>
                    <tr>
                        <th scope="col">Metric</th>
                        {comparison.columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {comparison.metrics.map((metric) => {
                        const values = comparison.columns.map((column) => comparison.cell(metric.id, column.key)?.value ?? null);
                        const present = values.filter((v): v is number => v !== null);
                        const min = Math.min(...present);
                        const max = Math.max(...present);
                        return (
                            <tr key={metric.id}>
                                <th scope="row">{metric.name}</th>
                                {comparison.columns.map((column, i) => {
                                    const cell = comparison.cell(metric.id, column.key);
                                    const value = values[i];
                                    const key = `${metric.id}|${column.key}`;
                                    const t = value === null ? 0 : max === min ? 0.5 : (value - min) / (max - min);
                                    return (
                                        <td
                                            key={column.key}
                                            className={value === null ? "is-empty" : undefined}
                                            style={value === null ? undefined : { background: shade(t), color: t > 0.6 ? "#fff" : undefined }}
                                            onMouseEnter={() => setHover(key)}
                                            onMouseLeave={() => setHover(null)}
                                        >
                                            {value === null ? "n/a" : formatNumber(value)}
                                            {hover === key && (
                                                <span className="lab-tooltip" role="tooltip" style={{ left: 0 }}>
                                                    <strong>{column.label}</strong>
                                                    <span>{metric.name}: {value === null ? cell?.reason ?? "no value" : formatMetric(value, metric)}</span>
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
