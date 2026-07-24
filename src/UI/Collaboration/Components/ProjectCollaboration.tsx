import React, { useEffect } from 'react';
import { Modal, Dropdown, Button } from 'react-bootstrap';
import { ExperimentRoleEnum } from '../../../Domain/Laboratory/Entities/Collaborator';
import './ProjectCollaboration.css';
import CollaborationMessageModal from './CollaborationMessageModal';
import RemoveCollaboratorConfirmationModal from './RemoveCollaboratorConfirmationModal';
import { getCollaborators, removeCollaborator, shareExperiment } from "../../../DataProvider/Services/experimentService";
import './ProjectCollaboration.css'
import { ExperimentDetailed, Experiment } from '@domain/Laboratory/Entities/Experiment';
import ShareDialog from './ShareDialog';
import { Collaborator } from '../../../Domain/Laboratory/Entities/Collaborator';
type ProjectCollaborationProps = {
  experiment: ExperimentDetailed;
};

export default function ProjectCollaboration({experiment}: ProjectCollaborationProps) {

  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = React.useState(false);
  const [collaborators, setCollaborators] = React.useState<Array<Collaborator>>([]);
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [messageModalTitle, setMessageModalTitle] = React.useState('');
  const [messageModalText, setMessageModalText] = React.useState('');
  const [showRemoveModal, setShowRemoveModal] = React.useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = React.useState<any | null>(null);
  const [openCollaboratorsAfterMessage, setOpenCollaboratorsAfterMessage] = React.useState(false);
  const isOwner = experiment.userRole === ExperimentRoleEnum.OWNER;

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const collaboratorsData = await getCollaborators(experiment.id);
        setCollaborators(collaboratorsData);
      } catch (error) {
        console.error("Error fetching collaborators:", error);
      }
    };
    fetchCollaborators();
  }, [experiment.id]);

  const handleInviteModalToggle = () => {
      setShowInviteModal(!showInviteModal);
  };

  const handleCollaboratorsModalToggle = () => {
    setShowCollaboratorsModal(!showCollaboratorsModal);
  };

  const closeMessage = () => {
    setShowMessageModal(false);
    setMessageModalTitle("");
    setMessageModalText("");
    setShowCollaboratorsModal(openCollaboratorsAfterMessage);
    setOpenCollaboratorsAfterMessage(false);
  };

  async function handleInviteCollaborator (experiment: Experiment, email: string, role: ExperimentRoleEnum) {
    console.log(`Inviting ${email} as ${role} to experiment ${experiment.id}`);
    await shareExperiment(experiment.id, email, role);
    // Refetch collaborators to update the list
    const collaboratorsData = await getCollaborators(experiment.id);
    setCollaborators(collaboratorsData);
  };

  const RemoveCollaborator = async () => {
    const collaborator = collaboratorToRemove;

    const showRemoveMessage = (
      title: string,
      message: string,
      openCollaboratorsAfterMessage = true
    ) => {
        setShowRemoveModal(false);
        setCollaboratorToRemove(null);
        setShowMessageModal(true);
        setMessageModalTitle(title);
        setMessageModalText(message);
        setOpenCollaboratorsAfterMessage(openCollaboratorsAfterMessage);
    };

    if (!collaborator) {
      return;
    }

    try {
      const response = await removeCollaborator(
        experiment.id,
        collaborator.id
      );

      if (!response) {
        showRemoveMessage("Error", "Could not remove collaborator.");
        return;
      }

      setCollaborators((prevCollaborators) => prevCollaborators.filter((collab) => collab.id !== collaborator.id));
      setShowRemoveModal(false);
      setCollaboratorToRemove(null);
      setShowMessageModal(true);
      setMessageModalTitle("Collaborator removed");
      setMessageModalText("Collaborator removed successfully.");
      setOpenCollaboratorsAfterMessage(true);
    } catch (error) {
      showRemoveMessage("Error", "An error occurred while removing the collaborator. Please try again.");
    }
  };

  const changeCollaboratorRole = async (experimentId: string, collaboratorEmail: string, newRole: ExperimentRoleEnum) => {

    const showRoleMessage = (title: string, message: string) => {
        setShowCollaboratorsModal(false);
        setShowMessageModal(true);
        setMessageModalTitle(title);
        setMessageModalText(message);
        setOpenCollaboratorsAfterMessage(true);
    };

    try {
      await shareExperiment(experimentId, collaboratorEmail, newRole);

      setCollaborators((prevCollaborators) =>
        prevCollaborators.map((collab) =>
          collab.email === collaboratorEmail ? { ...collab, role: newRole } : collab
        )
      );
      setShowCollaboratorsModal(false);
      setShowMessageModal(true);
      setMessageModalTitle("Role updated");
      setMessageModalText(`Collaborator role changed to ${newRole} successfully.`);
      setOpenCollaboratorsAfterMessage(true);
    } catch (error) {
      showRoleMessage("Error", "An error occurred while changing the collaborator role. Please try again.");
    }
  };

  function renderInviteModal() {
    
    return (
      <ShareDialog
        show={showInviteModal}
        onHide={handleInviteModalToggle}
        experiment={experiment}
        onShareExperiment={handleInviteCollaborator}
      />
    );
  }

  const renderCollaboratorsModal = () => {

    return (
      <Modal
        show={showCollaboratorsModal}
        onHide={handleCollaboratorsModalToggle}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Project Collaborators</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {collaborators.length === 0 ? (
            <p className="text-muted">No collaborators in this project.</p>
          ) : (
            <ul className="list-group">
              {collaborators.map((collaborator) => {
                const isCurrentUser = collaborator.name === experiment.author;
                return (
                  <li
                    key={collaborator.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <span>
                        <strong>{collaborator.name}</strong> ({collaborator.email})
                        {isCurrentUser && <span className="text-muted"> (You)</span>}
                      </span>
                      <br />
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Current role: {collaborator.role}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      {/* Dropdown para cambiar el rol */}
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="secondary"
                          size="sm"
                          id={`dropdown-role-${collaborator.id}`}
                          disabled={
                            isCurrentUser // Deshabilitar si el colaborador es el usuario actual
                          }
                        >
                          Change Role
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() =>
                              changeCollaboratorRole(experiment.id, collaborator.email, ExperimentRoleEnum.EDITOR)
                            }
                            disabled={isCurrentUser}
                          >
                            Editor
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              changeCollaboratorRole(experiment.id, collaborator.email, ExperimentRoleEnum.VIEWER)
                            }
                            disabled={isCurrentUser}
                          >
                            Viewer
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>

                      {/* Botón para eliminar colaborador */}
                      <Button
                        variant="danger"
                        size="sm"
                        className="ms-2"
                        onClick={() => {
                            setShowCollaboratorsModal(false);
                            setShowRemoveModal(true);
                            setCollaboratorToRemove(collaborator);
                        }
                        }
                        disabled={
                          isCurrentUser
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCollaboratorsModalToggle}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
        console.log("ProjectCollaboration component rendered with experiment:", experiment);

    return (
      <div className="project-collaboration">
        {isOwner && (
          <p
            title="Invite collaborators"
            onClick={handleInviteModalToggle}
            className="collaboration-button"
          >
            <span>👥 Invite</span>
          </p>
        )}

        <p
          title="View collaborators"
          onClick={handleCollaboratorsModalToggle}
          className="collaboration-button"
        >
          <span>👥 Collaborators ({collaborators.length})</span>
        </p>

        {renderInviteModal()}
        {renderCollaboratorsModal()}
        <CollaborationMessageModal
          show={showMessageModal}
          title={messageModalTitle}
          message={messageModalText}
          onClose={closeMessage}
        />
        <RemoveCollaboratorConfirmationModal
          show={showRemoveModal}
          collaboratorName={collaboratorToRemove?.name}
          onCancel={() => {
              setShowRemoveModal(false);
              setCollaboratorToRemove(null);
              setShowCollaboratorsModal(true);
            }
          }
          onConfirm={RemoveCollaborator}
        />
      </div>
    );
  }
