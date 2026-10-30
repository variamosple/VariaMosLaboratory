import { ProgressBar, Table } from "react-bootstrap";
import { Run } from "../../../../Domain/Laboratory/Entities/Run";
import { RunStatusBadge } from "../RunsPanel/RunsPanel";
import { formatDuration, formatMetric } from "./format";

const percent = (progress: number | null, status: string) =>
    Math.round(100 * (status === "completed" ? 1 : progress ?? 0));

/**
 * LAB-VIS-01: the latest run as it happens: state, progress of each scenario
 * run, and the metrics computed so far. Updated while the run is followed.
 */
export default function DashboardTab({ run }: { run: Run | null }) {
    if (!run) return <div className="lab-empty">No run yet: run the experiment to see its dashboard.</div>;

    const total = run.scenarioRuns.length;
    const ended = run.scenarioRuns.filter((s) => !["pending", "running"].includes(s.status)).length;
    const withMetrics = run.scenarioRuns.filter((s) => s.metrics.length > 0);
    const elapsed = run.startedAt ? (run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now()) - new Date(run.startedAt).getTime() : null;

    return (
        <div aria-label="Run dashboard">
            <div className="d-flex flex-wrap gap-4 align-items-center mb-3">
                <h6 className="mb-0">Run #{run.number} <RunStatusBadge status={run.status} /></h6>
                <span className="small text-muted">{ended} of {total} scenario runs ended · {formatDuration(elapsed)}</span>
                {run.failureReason && <span className="small text-danger">{run.failureReason}</span>}
            </div>

            <div className="mb-4">
                {run.scenarioRuns.map((s) => (
                    <div key={s.id} className="mb-2">
                        <div className="d-flex justify-content-between small">
                            <span>{s.scenarioName} · {s.solverId} {s.solverVersion}</span>
                            <span><RunStatusBadge status={s.status} /> {percent(s.progress, s.status)} %</span>
                        </div>
                        {/* As a child bar, the aria-label reaches the element with role progressbar */}
                        <ProgressBar>
                            <ProgressBar
                                now={percent(s.progress, s.status)}
                                variant={s.status === "failed" ? "danger" : s.status === "cancelled" ? "warning" : s.status === "completed" ? "success" : undefined}
                                animated={s.status === "running"}
                                aria-label={`Progress of ${s.scenarioName} with ${s.solverId}`}
                            />
                        </ProgressBar>
                    </div>
                ))}
            </div>

            <h6>Metrics computed so far ({withMetrics.length} of {total} scenario runs)</h6>
            {withMetrics.length === 0 ? (
                <p className="small text-muted">Metrics appear as each scenario run ends.</p>
            ) : (
                <Table size="sm" responsive aria-label="Metrics computed so far">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            {withMetrics.map((s) => <th key={s.id}>{s.scenarioName} · {s.solverId}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {run.provenance.metrics.map((metric) => (
                            <tr key={metric.id}>
                                <td>{metric.code && <span className="lab-code me-1">{metric.code}</span>}{metric.name}</td>
                                {withMetrics.map((s) => {
                                    const value = s.metrics.find((m) => m.metricId === metric.id);
                                    return (
                                        <td key={s.id} title={value?.reason ?? undefined}>
                                            {value?.value === null || value === undefined ? <span className="text-muted">n/a</span> : formatMetric(value.value, metric)}
                                            {value?.simulated && <span className="text-muted" title="From a simulated Reasoning answer"> *</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            {withMetrics.some((s) => s.metrics.some((m) => m.simulated)) && (
                <p className="small text-muted mb-0">* From a simulated answer of the Reasoning module (mock).</p>
            )}
        </div>
    );
}
