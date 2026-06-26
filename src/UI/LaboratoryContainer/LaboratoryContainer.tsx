import { useState, useEffect } from "react";
import { useSession } from "@variamosple/variamos-components";
import UserExperimentsContainer from "./ExperimentListContainer/UserExperimentsContainer";
import CreateExperimentButton from "../Buttons/CreateExperimentButton/CreateExperimentButton";
import {Tab, Tabs, Button, Modal} from "react-bootstrap";
import SharedExperimentsContainer from "./ExperimentListContainer/SharedExperimentsContainer";
import GroupExperimentsContainer from "./ExperimentListContainer/GroupExperimentsContainer";
import Layout from "../../core/components/Layout";
import "./LaboratoryContainer.css";
import { Experiment } from "../../Domain/Laboratory/Entities/Experiment";
import ExperimentCreationContainer from "./ExperimentCreationForm/ExperimentCreationForm";
import { Archive } from "react-bootstrap-icons";
import ArchivedExperimentsContainer from "./ExperimentListContainer/ArchivedExperimentsContainer";
import ExperimentContainer from "./ExperimentContainer/ExperimentContainer";

export default function LaboratoryContainer() {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [isCreatingExperiment, setCreatingExperiment] = useState(false);
  const [loadSharedExperiments, setLoadSharedExperiments] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(true);
  const [seeArchived, setSeeArchived] = useState(false);
  const [selectedArchivedExperiment, setSelectedArchivedExperiment] = useState<Experiment | null>(null);

  const { user } = useSession();

   useEffect(() => {
    const isGuest = user.roles.find((role) => role.toLowerCase() === "guest");
    setIsGuestUser(!!isGuest);
  }, [user]);

  const handleCreateClick = () => {
    setCreatingExperiment(true);
  };

  const handleClick = (experiment : Experiment) => {
    setExperiment(experiment);
    setCreatingExperiment(false);
  };

  const onArchivedExperimentSelect = (experiment: Experiment) => {
      if (selectedArchivedExperiment?.id === experiment.id) {
          setSelectedArchivedExperiment(null);
      } else setSelectedArchivedExperiment(experiment);
  };

  if (isGuestUser) {
    return (
      <Layout>
        <div className="guest-message-container">
            <div className="guest-message-title">
              Access Restricted
            </div>
            <div className="guest-message-text">
              Please log in or create an account to create, run, and save experiments
            </div>
          </div>
      </Layout>
    );
  }

  if (isCreatingExperiment) {
    return (
      <Layout>
        <ExperimentCreationContainer
          onExperimentCreated={handleClick}
          onCancel={() => setCreatingExperiment(false)}
        />
      </Layout>
    );
  }

  if (experiment) {
    return (
      <Layout>
        <ExperimentContainer experiment={experiment} setExperiment={setExperiment} />
      </Layout>
    );
  }

  return (
        <Layout>
        <div className="experimentlist-container">
          <div className="header-button-container">
            <CreateExperimentButton onClick={handleCreateClick} />
            <Button variant = "primary" onClick={() => setSeeArchived(!seeArchived)}>
              <Archive className="me-2" />
              Archived
            </Button>
          </div>

        <Tabs
            defaultActiveKey="userExperiments"
            id="uncontrolled-tab"
            onSelect={(eventKey) => {
            if (eventKey === "sharedExperiments") {
                setLoadSharedExperiments(true);
            }
            }}
        >
            <Tab
            eventKey="userExperiments"
            title="My Experiments"
            className="pt-3"
            unmountOnExit
            >
            <UserExperimentsContainer onExperimentClick={handleClick} mode="user" />
            </Tab>

            <Tab
            eventKey="sharedExperiments"
            title="Shared with me"
            className="pt-3"
            unmountOnExit
            >
            <SharedExperimentsContainer
                loadDataOnInit={loadSharedExperiments}
                onExperimentClick={handleClick}
                mode="shared"
            />
            </Tab>

            <Tab
            eventKey="groupExperiments"
            title="Group Experiments"
            className="pt-3"
            unmountOnExit
            >
            <GroupExperimentsContainer
                loadDataOnInit={loadSharedExperiments}
                onExperimentClick={handleClick}
                mode="group"
            />
            </Tab>
        </Tabs>
        </div>

      {seeArchived && (
        <Modal show={seeArchived} onHide={() => setSeeArchived(false)} size="xl" centered>
          <Modal.Header closeButton>
            <Modal.Title>Archived Experiments</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ArchivedExperimentsContainer onExperimentClick={() => {}} mode="archived" experimentSelected={selectedArchivedExperiment} onExperimentSelect={onArchivedExperimentSelect} />
          </Modal.Body>
          <Modal.Footer>
            {selectedArchivedExperiment && (
              <Button variant="info" onClick={() => {setExperiment(selectedArchivedExperiment)}}>
                See Experiment Details
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSeeArchived(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      </Layout>
    );
  }

