import { Fragment, useState } from "react";
import { Badge, Button, Table } from "react-bootstrap";
import { useSession } from "@variamosple/variamos-components";
import { Run, RunStatus, ScenarioRun } from "../../../../Domain/Laboratory/Entities/Run";
import * as alertify from "alertifyjs";
import { getRunPackage, permanentLink } from "../../../../DataProvider/Services/runService";
import { saveFile } from "../../../../DataProvider/Services/resultService";
import { errorMessage } from "../../../errorMessage";
import CommentThread from "../Comments/CommentThread";
import { Form } from "react-bootstrap";

const STATUS_VARIANT: Record<RunStatus, string> = {
    pending: "secondary",
    running: "primary",
    completed: "success",
    failed: "danger",
    cancelled: "warning",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
    return <Badge bg={STATUS_VARIANT[status]} text={status === "cancelled" ? "dark" : undefined}>{status}</Badge>;
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "–");

function duration(run: Run) {
    if (!run.startedAt) return "–";
    const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
    const seconds = Math.max(0, Math.round((end - new Date(run.startedAt).getTime()) / 1000));
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

function resultSummary(scenarioRun: ScenarioRun) {
    if (scenarioRun.error) return <span className="text-danger">{scenarioRun.error}</span>;
    const result = scenarioRun.result;
    if (!result) return <span className="text-muted">–</span>;
    return (
        <>
            {result.configurations !== undefined && <span>{result.configurations} configurations</span>}
            {result.features !== undefined && <span className="text-muted"> · {result.features} features</span>}
            {result.simulated && <Badge bg="light" text="dark" className="ms-2 border">simulated</Badge>}
        </>
    );
}

/** LAB-RP-02: what the run executed. */
function Provenance({ run }: { run: Run }) {
    const { provenance } = run;
    return (
        <div className="small">
            <div className="fw-semibold mb-1">Provenance</div>
            <div className="text-muted mb-2">
                Experiment version {provenance.experiment.version} · Reasoning: {provenance.reasoning.gateway} · Laboratory {provenance.laboratoryVersion}
            </div>
            {provenance.scenarios.map((scenario) => (
                <div key={scenario.scenarioId} className="mb-2">
                    <div className="fw-semibold">{scenario.name}</div>
                    <ul className="mb-0 ps-3">
                        {scenario.models.map((model) => (
                            <li key={model.modelId}>
                                Model {model.modelId} · copy <code title={model.hash}>{model.hash.slice(0, 12)}</code>
                            </li>
                        ))}
                        {scenario.solvers.map((solver) => (
                            <li key={solver.id}>
                                {solver.id} {solver.version}:{" "}
                                {Object.entries(solver.parameters).map(([name, value]) => `${name} = ${String(value)}`).join(", ")}
                            </li>
                        ))}
                        {scenario.operationalContext && (
                            <li>
                                Context: active [{scenario.operationalContext.activeFeatures.join(", ")}], inactive [
                                {scenario.operationalContext.inactiveFeatures.join(", ")}]
                                {scenario.operationalContext.extraConstraints && `, constraints: ${scenario.operationalContext.extraConstraints}`}
                            </li>
                        )}
                    </ul>
                </div>
            ))}
        </div>
    );
}

/** LAB-RP-01, LAB-RP-03: how to cite the run, and its reproducibility package. */
function Reproducibility({ run, experimentId }: { run: Run; experimentId: string }) {
    if (!run.persistentId) return null;
    const link = permanentLink(run.persistentId);

    const download = async () => {
        try {
            saveFile(await getRunPackage(experimentId, run.id));
        } catch (error) {
            alertify.error(errorMessage(error, "The package could not be downloaded."));
        }
    };

    return (
        <div className="d-flex flex-wrap align-items-center gap-2 small mb-3" aria-label={`Reproducibility of run ${run.number}`}>
            <span>Persistent identifier:</span>
            <code>{run.persistentId}</code>
            <Button size="sm" variant="outline-secondary" onClick={() => navigator.clipboard?.writeText(link).then(() => alertify.success("Link copied"))} title={link}>
                Copy permanent link
            </Button>
            <Button size="sm" variant="outline-primary" onClick={download}>Download reproducibility package</Button>
        </div>
    );
}

/** LAB-COL-03: annotate the result of a scenario run, as a whole or one of its metrics. */
function ResultAnnotations({ run }: { run: Run }) {
    const [scenarioRunId, setScenarioRunId] = useState(run.scenarioRuns[0]?.id ?? "");
    const [metricId, setMetricId] = useState("");
    const scenarioRun = run.scenarioRuns.find((s) => s.id === scenarioRunId);
    if (!scenarioRun) return null;
    const metric = run.provenance.metrics.find((m) => m.id === metricId);
    const title = `${scenarioRun.scenarioName} · ${scenarioRun.solverId}${metric ? ` · ${metric.name}` : ""}`;

    return (
        <div className="mt-3">
            <div className="d-flex flex-wrap gap-2 align-items-center small">
                <label htmlFor={`annotate-${run.id}`}>Annotate the result of</label>
                <Form.Select id={`annotate-${run.id}`} size="sm" className="w-auto" value={scenarioRunId} onChange={(e) => setScenarioRunId(e.target.value)}>
                    {run.scenarioRuns.map((s) => <option key={s.id} value={s.id}>{s.scenarioName} · {s.solverId}</option>)}
                </Form.Select>
                <Form.Select size="sm" className="w-auto" aria-label="Metric annotated" value={metricId} onChange={(e) => setMetricId(e.target.value)}>
                    <option value="">The whole result</option>
                    {run.provenance.metrics.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Form.Select>
            </div>
            <CommentThread targetType="scenario_run" targetId={scenarioRun.id} metricId={metricId || null} title={title} />
        </div>
    );
}

function RunDetails({ run, experimentId }: { run: Run; experimentId: string }) {
    return (
        <div className="p-2">
            <Reproducibility run={run} experimentId={experimentId} />
            {run.failureReason && <p className="text-danger small mb-2">{run.failureReason}</p>}
            {run.cancelledAt && (
                <p className="small mb-2">Cancelled by {run.cancelledByName ?? run.cancelledBy} on {formatDate(run.cancelledAt)}.</p>
            )}
            <Table size="sm" className="mb-3" aria-label={`Scenario runs of run ${run.number}`}>
                <thead>
                    <tr>
                        <th>Scenario</th>
                        <th>Solver</th>
                        <th>Status</th>
                        <th>Attempts</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {run.scenarioRuns.map((scenarioRun) => (
                        <tr key={scenarioRun.id}>
                            <td>{scenarioRun.scenarioName}</td>
                            <td>{scenarioRun.solverId} {scenarioRun.solverVersion}</td>
                            <td><RunStatusBadge status={scenarioRun.status} /></td>
                            <td title={scenarioRun.attemptLog.map((a) => `#${a.attempt} ${a.outcome}${a.error ? `: ${a.error}` : ""}`).join("\n")}>
                                {scenarioRun.attempts}
                                {scenarioRun.attemptLog.some((a) => a.outcome === "transient_error") && (
                                    <span className="text-muted"> (retried)</span>
                                )}
                            </td>
                            <td>{resultSummary(scenarioRun)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Provenance run={run} />
            <CommentThread targetType="run" targetId={run.id} title={`run ${run.number}`} />
            {run.scenarioRuns.some((s) => !["pending", "running"].includes(s.status)) && <ResultAnnotations run={run} />}
        </div>
    );
}

type RunsPanelProps = {
    experimentId: string;
    runs: Run[];
    loaded: boolean;
    initialOpenRunId?: string | null;
};

/** LAB-RUN-03: the runs of the experiment, their state and results, followed while they run. */
export default function RunsPanel({ experimentId, runs, loaded, initialOpenRunId = null }: RunsPanelProps) {
    const { user } = useSession();
    const [openRunId, setOpenRunId] = useState<string | null>(initialOpenRunId);

    return (
        <section className="experiment-card mt-4" aria-labelledby="runs-title">
            <h5 id="runs-title" className="mb-3">Runs</h5>
            {loaded && runs.length === 0 && <p className="text-muted mb-0">No run yet.</p>}
            {runs.length > 0 && (
                <Table hover responsive aria-label="Runs">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Status</th>
                            <th>Started by</th>
                            <th>Started</th>
                            <th>Duration</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((run) => (
                            <Fragment key={run.id}>
                                <tr>
                                    <td>{run.number}</td>
                                    <td><RunStatusBadge status={run.status} /></td>
                                    <td>{run.startedBy === user?.id ? "You" : run.startedByName ?? run.startedBy}</td>
                                    <td>{formatDate(run.startedAt ?? run.createdAt)}</td>
                                    <td>{duration(run)}</td>
                                    <td className="text-end">
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            aria-expanded={openRunId === run.id}
                                            onClick={() => setOpenRunId(openRunId === run.id ? null : run.id)}
                                        >
                                            {openRunId === run.id ? "Hide details" : `Details of run ${run.number}`}
                                        </Button>
                                    </td>
                                </tr>
                                {openRunId === run.id && (
                                    <tr>
                                        <td colSpan={6}><RunDetails run={run} experimentId={experimentId} /></td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </Table>
            )}
        </section>
    );
}
