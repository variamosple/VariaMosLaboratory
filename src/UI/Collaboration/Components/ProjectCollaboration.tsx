import React, { useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ExperimentRoleEnum } from '../../../Domain/Laboratory/Entities/Collaborator';
import './ProjectCollaboration.css';
import CollaborationMessageModal from './CollaborationMessageModal';
import RemoveCollaboratorConfirmationModal from './RemoveCollaboratorConfirmationModal';
import { getCollaborators, removeCollaborator, shareExperiment } from "../../../DataProvider/Services/experimentService";
import './ProjectCollaboration.css'
import { ExperimentDetailed, Experiment } from '@domain/Laboratory/Entities/Experiment';
import ShareDialog from './ShareDialog';
import { Collaborator, SharedAccess } from '../../../Domain/Laboratory/Entities/Collaborator';
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

  async function handleInviteCollaborator (experiment: Experiment, email: string, access: SharedAccess) {
    await shareExperiment(experiment.id, email, access);
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

  // LAB-COL-01: write and execute changed separately
  const changeCollaboratorAccess = async (experimentId: string, collaborator: Collaborator, access: SharedAccess) => {

    const showRoleMessage = (title: string, message: string) => {
        setShowCollaboratorsModal(false);
        setShowMessageModal(true);
        setMessageModalTitle(title);
        setMessageModalText(message);
        setOpenCollaboratorsAfterMessage(true);
    };

    try {
      await shareExperiment(experimentId, collaborator.email, access);
      setCollaborators(await getCollaborators(experimentId));
    } catch (error) {
      showRoleMessage("Error", "An error occurred while changing the collaborator permissions. Please try again.");
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
                        {collaborator.role}: {collaborator.permissions
                          ? ["read", "write", "execute"].filter((p) => (collaborator.permissions as any)[p]).join(", ")
                          : "read"}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      {/* LAB-COL-01: owners and directors keep every permission */}
                      {collaborator.role !== ExperimentRoleEnum.OWNER && collaborator.role !== ExperimentRoleEnum.DIRECTOR && (
                        <div className="d-flex gap-3" aria-label={`Permissions of ${collaborator.name}`}>
                          <Form.Check
                            id={`write-${collaborator.id}`}
                            label="Write"
                            checked={!!collaborator.permissions?.write}
                            disabled={isCurrentUser || !isOwner}
                            onChange={() => changeCollaboratorAccess(experiment.id, collaborator, { write: !collaborator.permissions?.write, execute: !!collaborator.permissions?.execute })}
                          />
                          <Form.Check
                            id={`execute-${collaborator.id}`}
                            label="Execute"
                            checked={!!collaborator.permissions?.execute}
                            disabled={isCurrentUser || !isOwner}
                            onChange={() => changeCollaboratorAccess(experiment.id, collaborator, { write: !!collaborator.permissions?.write, execute: !collaborator.permissions?.execute })}
                          />
                        </div>
                      )}

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
