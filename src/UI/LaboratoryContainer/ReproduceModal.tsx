import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { reproduceFromPackage } from "../../DataProvider/Services/runService";
import { ProjectSummary } from "../../DataProvider/Services/userProjectsService";
import { ExperimentDetailed } from "../../Domain/Laboratory/Entities/Experiment";
import { errorMessage } from "../errorMessage";
import ProjectSelect from "../ProjectSelect/ProjectSelect";

type ReproduceModalProps = {
    show: boolean;
    projects: ProjectSummary[];
    defaultProjectId: string;
    onClose: () => void;
    onReproduced: (experiment: ExperimentDetailed, metricsLeftOut: string[]) => void;
};

/** LAB-RP-01: rebuild the experiment of a reproducibility package, Ready to run again. */
export default function ReproduceModal({ show, projects, defaultProjectId, onClose, onReproduced }: ReproduceModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [projectId, setProjectId] = useState(defaultProjectId);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (!file || !projectId) return;
        setBusy(true);
        setError(null);
        try {
            const { experiment, metricsLeftOut } = await reproduceFromPackage(file, projectId);
            onReproduced(experiment, metricsLeftOut);
        } catch (e) {
            setError(errorMessage(e, "The package could not be read."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Reproduce from a package</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="small text-muted">
                    The experiment is rebuilt as a Ready experiment with the exact models, solvers, parameters and contexts of the run.
                    Every file of the package is checked against its hash.
                </p>
                <Form.Group className="mb-3" controlId="reproduce-file">
                    <Form.Label>Reproducibility package (.zip)</Form.Label>
                    <Form.Control type="file" accept=".zip,application/zip" onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)} />
                </Form.Group>
                <Form.Group controlId="reproduce-project">
                    <Form.Label>Project</Form.Label>
                    <ProjectSelect id="reproduce-project" projects={projects} value={projectId} onChange={setProjectId} />
                </Form.Group>
                {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={submit} disabled={!file || !projectId || busy}>Reproduce</Button>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}
