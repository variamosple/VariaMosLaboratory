import { Modal, Dropdown, Form, FormGroup } from 'react-bootstrap';
import { ExperimentRoleEnum } from '../../../Domain/Laboratory/Entities/Collaborator';
import { useState } from 'react';
import { Experiment } from '../../../Domain/Laboratory/Entities/Experiment';

type ShareDialogProps = {
    show: boolean;
    onHide: () => void;
    experiment: Experiment;
    onShareExperiment: (experiment: Experiment, email: string, role: ExperimentRoleEnum) => void;
}

export default function ShareDialog({ show, onHide, experiment, onShareExperiment }: ShareDialogProps) {
    const [shareInput, setShareInput] = useState('');
    const [shareRole, setShareRole] = useState(ExperimentRoleEnum.VIEWER);

    const handleInviteCollaborator = () => {
        onShareExperiment(experiment, shareInput, shareRole);
        setShareInput('');
        setShareRole(ExperimentRoleEnum.VIEWER);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Invite Collaborator</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <FormGroup controlId="shareInput">
                        <label>User Email</label>
                            <FormGroup>
                                <input type="email"
                                    className="form-control"
                                    placeholder="Enter User Email"
                                    value={shareInput}
                                    onChange={(e) => setShareInput(e.target.value)}
                                />
                        </FormGroup>
                    </FormGroup>
                    <FormGroup controlId="shareRole">
                        <label>User Role</label>
                        <FormGroup>
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary"  id="dropdown-basic">
                                    {shareRole}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => setShareRole(ExperimentRoleEnum.VIEWER)}>
                                        {ExperimentRoleEnum.VIEWER}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => setShareRole(ExperimentRoleEnum.EDITOR)}>
                                        {ExperimentRoleEnum.EDITOR}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </FormGroup>
                    </FormGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <button  className="btn btn-secondary"  onClick={onHide}>
                    Cancel
                </button>
                <button className="btn btn-primary"  onClick={handleInviteCollaborator}>
                    Invite
                </button>
            </Modal.Footer>
        </Modal>
    );
}
