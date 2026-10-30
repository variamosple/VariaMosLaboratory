import { useState } from "react";
import { Button, Collapse, Form } from "react-bootstrap";

/** LAB-COL-04: researcher, status, creation date and type; the project is chosen above the lists. */
export interface ListFilterValues {
    researcher?: string;
    status?: string;
    createdFrom?: string;
    createdTo?: string;
    type?: "experiment" | "template" | "benchmark";
}

const STATUSES = ["draft", "ready", "running", "completed", "failed", "cancelled"];

export default function ListFilters({ onApply }: { onApply: (filters: ListFilterValues) => void }) {
    const [open, setOpen] = useState(false);
    const [values, setValues] = useState<ListFilterValues>({});
    const set = (key: keyof ListFilterValues, value: string) => setValues({ ...values, [key]: value || undefined });
    const active = Object.values(values).filter(Boolean).length;

    return (
        <div className="mb-3">
            <Button size="sm" variant="outline-secondary" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="list-filters">
                Filters{active ? ` (${active})` : ""}
            </Button>
            <Collapse in={open}>
                <div id="list-filters">
                    <Form
                        className="d-flex flex-wrap gap-3 align-items-end mt-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            onApply(values);
                        }}
                        aria-label="Filters"
                    >
                        <Form.Group controlId="filter-researcher">
                            <Form.Label className="small mb-1">Researcher</Form.Label>
                            <Form.Control size="sm" placeholder="Name or e-mail" value={values.researcher ?? ""} onChange={(e) => set("researcher", e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="filter-status">
                            <Form.Label className="small mb-1">Status</Form.Label>
                            <Form.Select size="sm" value={values.status ?? ""} onChange={(e) => set("status", e.target.value)}>
                                <option value="">Any</option>
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="filter-type">
                            <Form.Label className="small mb-1">Type</Form.Label>
                            <Form.Select size="sm" value={values.type ?? ""} onChange={(e) => set("type", e.target.value)}>
                                <option value="">Any</option>
                                <option value="experiment">Experiment</option>
                                <option value="template">Template</option>
                                <option value="benchmark">Benchmark</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="filter-from">
                            <Form.Label className="small mb-1">Created from</Form.Label>
                            <Form.Control size="sm" type="date" value={values.createdFrom ?? ""} onChange={(e) => set("createdFrom", e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="filter-to">
                            <Form.Label className="small mb-1">to</Form.Label>
                            <Form.Control size="sm" type="date" value={values.createdTo ?? ""} onChange={(e) => set("createdTo", e.target.value)} />
                        </Form.Group>
                        <Button size="sm" type="submit">Apply</Button>
                        <Button size="sm" variant="link" onClick={() => { setValues({}); onApply({}); }}>Clear</Button>
                    </Form>
                </div>
            </Collapse>
        </div>
    );
}
