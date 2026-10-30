import { useEffect, useMemo, useState } from "react";
import { Alert, Form, Spinner, Table } from "react-bootstrap";
import { getResults } from "../../../../DataProvider/Services/resultService";
import { Run } from "../../../../Domain/Laboratory/Entities/Run";
import { Results } from "../../../../Domain/Laboratory/Entities/Results";
import { buildComparison, seriesAcrossRuns } from "./comparison";
import { formatMetric } from "./format";
import MetricBars from "./MetricBars";
import MetricLineChart from "./MetricLineChart";
import ScatterChart from "./ScatterChart";
import Heatmap from "./Heatmap";

const toggle = (set: Set<string>, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
};

/**
 * LAB-MT-04, LAB-CF-03, LAB-VIS-02: metrics of the chosen runs, scenario by
 * scenario, in one table and in charts; filters on metrics and scenarios.
 */
export default function CompareTab({ experimentId, runs }: { experimentId: string; runs: Run[] }) {
    const finished = useMemo(() => runs.filter((run) => !["pending", "running"].includes(run.status)), [runs]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [results, setResults] = useState<Results | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [metricIds, setMetricIds] = useState<Set<string> | null>(null);
    const [scenarios, setScenarios] = useState<Set<string> | null>(null);
    const [xMetric, setXMetric] = useState("");
    const [yMetric, setYMetric] = useState("");

    // The latest finished run by default
    const finishedKey = finished.map((run) => run.id).join(",");
    useEffect(() => {
        setSelected((current) => (current.size > 0 ? current : new Set(finished.slice(0, 1).map((run) => run.id))));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finishedKey]);

    const selectedKey = [...selected].sort().join(",");
    useEffect(() => {
        if (selected.size === 0) {
            setResults(null);
            return;
        }
        setError(null);
        getResults(experimentId, [...selected])
            .then((loaded) => {
                setResults(loaded);
                setMetricIds((current) => current ?? new Set(loaded.metrics.map((m) => m.id)));
                setScenarios((current) => current ?? new Set(loaded.rows.map((r) => r.scenarioName ?? "")));
                setXMetric((current) => current || loaded.metrics[0]?.id || "");
                setYMetric((current) => current || loaded.metrics[1]?.id || loaded.metrics[0]?.id || "");
            })
            .catch(() => setError("The results could not be loaded."));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [experimentId, selectedKey]);

    if (finished.length === 0) return <div className="lab-empty">No finished run to compare yet.</div>;

    const comparison = results ? buildComparison(results, { metricIds: metricIds ?? undefined, scenarios: scenarios ?? undefined }) : null;
    const allScenarios = results ? [...new Set(results.rows.map((r) => r.scenarioName ?? ""))].sort() : [];
    const severalRuns = selected.size > 1;
    const metricById = new Map((results?.metrics ?? []).map((m) => [m.id, m]));
    const scatterPoints = comparison
        ? comparison.columns
              .map((column) => ({ label: column.label, x: comparison.cell(xMetric, column.key)?.value ?? null, y: comparison.cell(yMetric, column.key)?.value ?? null }))
              .filter((p): p is { label: string; x: number; y: number } => p.x !== null && p.y !== null)
        : [];

    return (
        <div aria-label="Comparison">
            <fieldset className="mb-3">
                <legend className="h6">Runs</legend>
                <div className="d-flex flex-wrap gap-3">
                    {finished.map((run) => (
                        <Form.Check
                            key={run.id}
                            id={`compare-run-${run.id}`}
                            label={`Run ${run.number} (${run.status})`}
                            checked={selected.has(run.id)}
                            onChange={() => setSelected(toggle(selected, run.id))}
                        />
                    ))}
                </div>
            </fieldset>

            {error && <Alert variant="danger">{error}</Alert>}
            {selected.size === 0 && <p className="text-muted">Select at least one run.</p>}
            {selected.size > 0 && !results && !error && <Spinner animation="border" size="sm" />}

            {results && comparison && (
                <>
                    <div className="d-flex flex-wrap gap-5 mb-3">
                        <fieldset>
                            <legend className="h6">Metrics</legend>
                            {results.metrics.map((metric) => (
                                <Form.Check
                                    key={metric.id}
                                    id={`compare-metric-${metric.id}`}
                                    label={metric.name}
                                    checked={metricIds?.has(metric.id) ?? true}
                                    onChange={() => setMetricIds(toggle(metricIds ?? new Set(), metric.id))}
                                />
                            ))}
                        </fieldset>
                        <fieldset>
                            <legend className="h6">Scenarios</legend>
                            {allScenarios.map((name) => (
                                <Form.Check
                                    key={name}
                                    id={`compare-scenario-${name}`}
                                    label={name}
                                    checked={scenarios?.has(name) ?? true}
                                    onChange={() => setScenarios(toggle(scenarios ?? new Set(), name))}
                                />
                            ))}
                        </fieldset>
                    </div>

                    <h6>All metrics, all scenario runs</h6>
                    <Table size="sm" bordered responsive aria-label="Metric comparison">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                {comparison.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.metrics.map((metric) => (
                                <tr key={metric.id}>
                                    <th scope="row">{metric.code && <span className="lab-code me-1">{metric.code}</span>}{metric.name}</th>
                                    {comparison.columns.map((column) => {
                                        const cell = comparison.cell(metric.id, column.key);
                                        return (
                                            <td key={column.key} title={cell?.reason ?? undefined}>
                                                {cell?.value === null || !cell ? <span className="text-muted">n/a</span> : formatMetric(cell.value, metric)}
                                                {cell?.simulated && <span className="text-muted" title="From a simulated Reasoning answer"> *</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {results.rows.some((r) => r.simulated) && (
                        <p className="small text-muted">* From a simulated answer of the Reasoning module (mock). Hover “n/a” for the reason a value is missing.</p>
                    )}

                    <h6 className="mt-4">By scenario run</h6>
                    <div className="lab-chart-grid mb-4">
                        {comparison.metrics.map((metric) => (
                            <MetricBars
                                key={metric.id}
                                metric={metric}
                                rows={comparison.columns.map((column) => {
                                    const cell = comparison.cell(metric.id, column.key);
                                    return { label: column.label, value: cell?.value ?? null, note: cell?.reason, simulated: cell?.simulated };
                                })}
                            />
                        ))}
                    </div>

                    {severalRuns && (
                        <>
                            <h6>Across runs</h6>
                            <div className="lab-chart-grid mb-4">
                                {comparison.metrics.map((metric) => {
                                    const { runNumbers, series } = seriesAcrossRuns(
                                        { ...results, rows: results.rows.filter((r) => scenarios?.has(r.scenarioName ?? "") ?? true) },
                                        metric.id
                                    );
                                    return <MetricLineChart key={metric.id} metric={metric} runNumbers={runNumbers} series={series} />;
                                })}
                            </div>
                        </>
                    )}

                    <h6>Two metrics against each other</h6>
                    <div className="d-flex gap-3 align-items-center small mb-2">
                        <label htmlFor="scatter-x">X</label>
                        <Form.Select id="scatter-x" size="sm" className="w-auto" value={xMetric} onChange={(e) => setXMetric(e.target.value)}>
                            {results.metrics.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Form.Select>
                        <label htmlFor="scatter-y">Y</label>
                        <Form.Select id="scatter-y" size="sm" className="w-auto" value={yMetric} onChange={(e) => setYMetric(e.target.value)}>
                            {results.metrics.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Form.Select>
                    </div>
                    {metricById.get(xMetric) && metricById.get(yMetric) && (
                        <ScatterChart xMetric={metricById.get(xMetric)!} yMetric={metricById.get(yMetric)!} points={scatterPoints} />
                    )}

                    <h6 className="mt-4">Heatmap</h6>
                    <Heatmap comparison={comparison} />
                </>
            )}
        </div>
    );
}
