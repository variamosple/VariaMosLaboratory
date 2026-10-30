import { Modal, Form } from 'react-bootstrap';
import { SharedAccess } from '../../../Domain/Laboratory/Entities/Collaborator';
import { useState } from 'react';
import { Experiment } from '../../../Domain/Laboratory/Entities/Experiment';

type ShareDialogProps = {
    show: boolean;
    onHide: () => void;
    experiment: Experiment;
    onShareExperiment: (experiment: Experiment, email: string, access: SharedAccess) => void;
}

/** LAB-COL-01: share with read, and with write and execute chosen separately. */
export default function ShareDialog({ show, onHide, experiment, onShareExperiment }: ShareDialogProps) {
    const [shareInput, setShareInput] = useState('');
    const [access, setAccess] = useState<SharedAccess>({ write: false, execute: false });

    const handleInviteCollaborator = () => {
        onShareExperiment(experiment, shareInput, access);
        setShareInput('');
        setAccess({ write: false, execute: false });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Invite Collaborator</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="shareInput" className="mb-3">
                        <Form.Label>User Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter User Email"
                            value={shareInput}
                            onChange={(e) => setShareInput(e.target.value)}
                        />
                    </Form.Group>
                    <fieldset>
                        <legend className="form-label fs-6">Permissions</legend>
                        <Form.Check id="share-read" label="Read: see the experiment, its runs and results, and comment" checked disabled />
                        <Form.Check id="share-write" label="Write: edit the configuration and mark it Ready" checked={access.write} onChange={() => setAccess({ ...access, write: !access.write })} />
                        <Form.Check id="share-execute" label="Execute: start and cancel runs" checked={access.execute} onChange={() => setAccess({ ...access, execute: !access.execute })} />
                    </fieldset>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-secondary" onClick={onHide}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={handleInviteCollaborator} disabled={!shareInput.trim()}>
                    Invite
                </button>
            </Modal.Footer>
        </Modal>
    );
}
