import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, InputGroup, Table } from "react-bootstrap";
import { compareRuns } from "../../../../DataProvider/Services/runService";
import { Run, RunComparison } from "../../../../Domain/Laboratory/Entities/Run";
import { errorMessage } from "../../../errorMessage";
import MetricBars from "./MetricBars";

/** Leaf paths of a nested object, arrays kept whole. */
export function flatten(value: unknown, prefix = ""): Map<string, unknown> {
    const out = new Map<string, unknown>();
    if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.entries(value as Record<string, unknown>).forEach(([key, child]) =>
            flatten(child, prefix ? `${prefix}/${key}` : key).forEach((v, k) => out.set(k, v))
        );
    } else if (prefix) {
        out.set(prefix, value);
    }
    return out;
}

const show = (value: unknown) => (value === undefined ? "—" : typeof value === "string" ? value : JSON.stringify(value));

const runLabel = (run: RunComparison["runs"][number]) => `${run.experiment.name} · run ${run.number}`;

function SideTable({ title, comparison, part, onlyDifferences }: { title: string; comparison: RunComparison; part: "configuration" | "results"; onlyDifferences: boolean }) {
    const flat = comparison.runs.map((run) => flatten(run[part]));
    const differing = new Set(comparison.differences[part]);
    const paths = [...new Set(flat.flatMap((m) => [...m.keys()]))].sort().filter((p) => !onlyDifferences || differing.has(p));

    return (
        <>
            <h6 className="mt-3">{title} <span className="small text-muted">({comparison.differences[part].length} {comparison.differences[part].length === 1 ? "difference" : "differences"})</span></h6>
            <Table size="sm" bordered responsive aria-label={`${title} side by side`}>
                <thead>
                    <tr>
                        <th>Setting</th>
                        {comparison.runs.map((run) => <th key={run.runId}>{runLabel(run)}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {paths.map((path) => (
                        <tr key={path} className={differing.has(path) ? "table-warning" : undefined} aria-label={differing.has(path) ? `Differs: ${path}` : path}>
                            <th scope="row" className="fw-normal small">{path.replace(/\//g, " › ")}</th>
                            {flat.map((m, i) => <td key={comparison.runs[i].runId} className="small">{show(m.get(path))}</td>)}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

/**
 * LAB-RP-04: runs side by side, of this experiment or of others (added by
 * persistent id), with the differences highlighted; LAB-VIS-02 metric charts
 * across the experiments.
 */
export default function SideBySideTab({ runs }: { runs: Run[] }) {
    const finished = useMemo(() => runs.filter((run) => !["pending", "running"].includes(run.status)), [runs]);
    const [selected, setSelected] = useState<string[]>([]);
    const [others, setOthers] = useState<string[]>([]);
    const [reference, setReference] = useState("");
    const [comparison, setComparison] = useState<RunComparison | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [onlyDifferences, setOnlyDifferences] = useState(true);

    const references = [...selected, ...others];
    const key = references.join(",");
    useEffect(() => {
        if (references.length < 2) {
            setComparison(null);
            return;
        }
        setError(null);
        compareRuns(references)
            .then(setComparison)
            .catch((e) => setError(errorMessage(e, "The runs could not be compared.")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const metricCharts = comparison
        ? (() => {
              const byMetric = new Map<string, { label: string; value: number | null; note?: string }[]>();
              comparison.runs.forEach((run) =>
                  flatten(run.results).forEach((value, path) => {
                      const match = /^(.*)\/metrics\/(.*)$/.exec(path);
                      if (!match) return;
                      const rows = byMetric.get(match[2]) ?? [];
                      rows.push({ label: `${runLabel(run)} · ${match[1]}`, value: typeof value === "number" ? value : null, note: typeof value === "string" ? value : undefined });
                      byMetric.set(match[2], rows);
                  })
              );
              return [...byMetric.entries()];
          })()
        : [];

    return (
        <div aria-label="Runs side by side">
            <fieldset className="mb-2">
                <legend className="h6">Runs of this experiment</legend>
                <div className="d-flex flex-wrap gap-3">
                    {finished.map((run) => (
                        <Form.Check
                            key={run.id}
                            id={`side-run-${run.id}`}
                            label={`Run ${run.number} (${run.status})`}
                            checked={selected.includes(run.id)}
                            onChange={() => setSelected(selected.includes(run.id) ? selected.filter((id) => id !== run.id) : [...selected, run.id])}
                        />
                    ))}
                </div>
            </fieldset>
            <Form
                className="mb-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    const value = reference.trim().toUpperCase();
                    if (value && !others.includes(value)) setOthers([...others, value]);
                    setReference("");
                }}
            >
                <Form.Label htmlFor="side-reference" className="h6">Run of another experiment</Form.Label>
                <InputGroup style={{ maxWidth: 520 }}>
                    <Form.Control id="side-reference" placeholder="VLAB-XXXX-XXXX-XXXX-XXXX" value={reference} onChange={(e) => setReference(e.target.value)} />
                    <Button type="submit" variant="outline-primary">Add</Button>
                </InputGroup>
                {others.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2 small">
                        {others.map((other) => (
                            <Button key={other} size="sm" variant="light" className="border" onClick={() => setOthers(others.filter((o) => o !== other))} title="Remove">
                                {other} ×
                            </Button>
                        ))}
                    </div>
                )}
            </Form>

            {error && <Alert variant="danger">{error}</Alert>}
            {references.length < 2 && <p className="text-muted">Choose at least two runs.</p>}

            {comparison && (
                <>
                    <Alert variant={comparison.equivalent ? "success" : "warning"} className="py-2">
                        {comparison.equivalent
                            ? "Equivalent results: the runs give the same results, timings apart."
                            : `The results differ (${comparison.differences.results.length} values).`}
                    </Alert>
                    <Form.Check
                        id="side-only-differences"
                        type="switch"
                        label="Show only the differences"
                        checked={onlyDifferences}
                        onChange={() => setOnlyDifferences(!onlyDifferences)}
                    />
                    <SideTable title="Setup" comparison={comparison} part="configuration" onlyDifferences={onlyDifferences} />
                    <SideTable title="Results" comparison={comparison} part="results" onlyDifferences={onlyDifferences} />

                    <h6 className="mt-3">Metrics across the runs</h6>
                    <div className="lab-chart-grid">
                        {metricCharts.map(([name, rows]) => (
                            <MetricBars key={name} metric={{ code: null, name, unit: null }} rows={rows} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
