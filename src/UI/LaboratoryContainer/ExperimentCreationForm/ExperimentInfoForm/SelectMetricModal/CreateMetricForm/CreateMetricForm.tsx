import { Form, Row, Col, InputGroup, Button } from "react-bootstrap";
import { useState } from "react";
import "./CreateMetricForm.css";
import { Metric } from "@domain/Laboratory/Entities/Metric";

type CreateMetricFormProps = {
    onCreate: (newMetric: Metric) => void;
};

export default function CreateMetricForm({ onCreate }: CreateMetricFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [formula, setFormula] = useState("");
    const [unit, setUnit] = useState("");
    const [script, setScript] = useState("");

    const handleCreate = () => {
        if (!name || !formula || !unit || !script) {
            alert("Please fill in all required fields (marked with *)");
            return;
        }
        const newMetric: Metric = {
            id: crypto.randomUUID(),
            name,
            description,
            formula,
            unit,
            script,
        };
        onCreate(newMetric);
        setName("");
        setDescription("");
        setFormula("");
        setUnit("");
        setScript("");
    };

    return (
        <>
        <Form>
            <Row className="g-4">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>
                            Metric name <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Control
                            type="text"
                            placeholder="e.g. Error Rate"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Description</Form.Label>

                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Describe what this metric measures and when it is useful..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mt-5">
                <Form.Label>
                    Formula & Unit <span className="text-danger">*</span>
                </Form.Label>

                <div className="d-flex flex-column flex-md-row gap-2">
                    <Form.Control
                        type="text"
                        placeholder="e.g. (errors / total) * 100"
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                    />

                    <InputGroup className="flex-shrink-0" style={{ width: "auto" }}>
                        <InputGroup.Text>Unit</InputGroup.Text>

                        <Form.Control
                            type="text"
                            placeholder="%"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            style={{ width: "100px" }}
                        />
                    </InputGroup>
                </div>
            </Form.Group>

            <Form.Group className="mt-5">
                <Form.Label>
                    Script input <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                    as="textarea"
                    rows={10}
                    placeholder="Write your script here..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="metric-script-editor"
                />
            </Form.Group>
        </Form>
        <div className="d-flex justify-content-end mt-4">
            <Button
                variant="primary"
                onClick={handleCreate}
            >
                Create Metric
            </Button>
        </div>
    </>
    );
}