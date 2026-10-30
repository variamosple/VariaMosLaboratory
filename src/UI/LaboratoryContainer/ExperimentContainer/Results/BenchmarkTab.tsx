import { useEffect, useState } from "react";
import { Alert, Table } from "react-bootstrap";
import { getBenchmark } from "../../../../DataProvider/Services/resultService";
import { SolverBenchmark } from "../../../../Domain/Laboratory/Entities/Results";
import { formatDuration, formatPercent } from "./format";
import MetricBars from "./MetricBars";

/** LAB-MT-06: the solvers compared on every run of the experiment. */
export default function BenchmarkTab({ experimentId, refreshKey }: { experimentId: string; refreshKey: string }) {
    const [solvers, setSolvers] = useState<SolverBenchmark[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getBenchmark(experimentId)
            .then(setSolvers)
            .catch(() => setError("The benchmark could not be loaded."));
    }, [experimentId, refreshKey]);

    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!solvers) return null;
    if (solvers.length === 0) return <div className="lab-empty">No run yet.</div>;

    return (
        <div aria-label="Solver benchmark">
            <Table size="sm" responsive aria-label="Solvers">
                <thead>
                    <tr>
                        <th>Solver</th>
                        <th>Scenario runs</th>
                        <th>Success rate</th>
                        <th>Response time (mean)</th>
                        <th>Median</th>
                        <th>Min – max</th>
                        <th>Retries</th>
                        <th>Agreement</th>
                    </tr>
                </thead>
                <tbody>
                    {solvers.map((s) => (
                        <tr key={s.solverId}>
                            <td>{s.solverId} {s.versions.join(", ")}</td>
                            <td>{s.scenarioRuns} ({s.completed} completed, {s.failed} failed{s.cancelled ? `, ${s.cancelled} cancelled` : ""})</td>
                            <td>{formatPercent(s.successRate)}</td>
                            <td>{formatDuration(s.responseTimeMs?.mean)}</td>
                            <td>{formatDuration(s.responseTimeMs?.median)}</td>
                            <td>{s.responseTimeMs ? `${formatDuration(s.responseTimeMs.min)} – ${formatDuration(s.responseTimeMs.max)}` : "—"}</td>
                            <td>{s.retries}</td>
                            <td title={s.compared ? `${s.compared} answers compared with the other solvers` : "Needs a second solver on the same scenario"}>
                                {formatPercent(s.agreementRate)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <p className="small text-muted">
                Response times come from the execution log (the attempt that completed). Agreement: share of answers equal to the
                majority of the solvers on the same scenario and run, a measure of solution quality when the right answer is unknown.
            </p>
            <div className="lab-chart-grid">
                <MetricBars
                    metric={{ code: null, name: "Mean response time", unit: "ms" }}
                    rows={solvers.map((s) => ({ label: s.solverId, value: s.responseTimeMs ? Math.round(s.responseTimeMs.mean) : null, note: "No completed run" }))}
                />
                <MetricBars
                    metric={{ code: null, name: "Success rate", unit: "ratio (0–1)" }}
                    rows={solvers.map((s) => ({ label: s.solverId, value: s.successRate, note: "No finished run" }))}
                />
            </div>
        </div>
    );
}
