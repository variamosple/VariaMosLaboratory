import { useState, useEffect } from "react";
import { usePaginatedQuery, useSession } from "@variamosple/variamos-components";
import UserExperimentsContainer from "./ExperimentListContainer/UserExperimentsContainer";
import CreateExperimentButton from "../Buttons/CreateExperimentButton/CreateExperimentButton";
import {Tab, Tabs, Button, Modal} from "react-bootstrap";
import SharedExperimentsContainer from "./ExperimentListContainer/SharedExperimentsContainer";
import GroupExperimentsContainer from "./ExperimentListContainer/GroupExperimentsContainer";
import Layout from "../../core/components/Layout";
import "./LaboratoryContainer.css";
import { Experiment, ExperimentDetailed } from "../../Domain/Laboratory/Entities/Experiment";
import ExperimentCreationContainer from "./ExperimentCreationForm/ExperimentCreationForm";
import { Archive } from "react-bootstrap-icons";
import ArchivedExperimentsContainer from "./ExperimentListContainer/ArchivedExperimentsContainer";
import ExperimentContainer from "./ExperimentContainer/ExperimentContainer";
import { ExperimentFilter } from "../../Domain/Laboratory/Entities/ExperimentFilter";
import { getGroupExperiments, getSharedExperiments, getUserExperiments, getArchivedExperiments, getExperimentDetailed } from "../../DataProvider/Services/experimentService";

export default function LaboratoryContainer() {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [isCreatingExperiment, setCreatingExperiment] = useState(false);
  const [loadSharedExperiments, setLoadSharedExperiments] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(true);
  const [seeArchived, setSeeArchived] = useState(false);
  const [selectedArchivedExperiment, setSelectedArchivedExperiment] = useState<Experiment | null>(null);
  const [isEditingExperiment, setEditingExperiment] = useState(false);
  const [experimentDetailed, setExperimentDetailed] = useState<ExperimentDetailed | null>(null);
  const [activeTab, setActiveTab] = useState("userExperiments");
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
    setEditingExperiment(false);
  };

  function reloadPages() {
    if (userQueryData.filter)
    userQueryData.onPageChange(userQueryData.currentPage);

    if (sharedQueryData.filter)
        sharedQueryData.onPageChange(sharedQueryData.currentPage);

    if (groupQueryData.filter)
        groupQueryData.onPageChange(groupQueryData.currentPage);

    if (ArchivedQueryData.filter)
        ArchivedQueryData.onPageChange(ArchivedQueryData.currentPage);
  }

  const handleExperimentRestored = () => {
    reloadPages();
    setSelectedArchivedExperiment(null);
    setSeeArchived(false);
  };

  function handleCopyExperiment() {
    reloadPages();
    setSeeArchived(false);
  }

  async function onExperimentEdit(experiment: Experiment) {
    const detailed = await getExperimentDetailed(experiment.id);

    setExperimentDetailed(detailed);
    setEditingExperiment(true);
  }

  const onArchivedExperimentSelect = (experiment: Experiment) => {
      if (selectedArchivedExperiment?.id === experiment.id) {
          setSelectedArchivedExperiment(null);
      } else setSelectedArchivedExperiment(experiment);
  };

  const userQueryData = usePaginatedQuery<ExperimentFilter, Experiment>({
    queryFunction: getUserExperiments,
    initialFilter: new ExperimentFilter(),
  });
  
  const sharedQueryData = usePaginatedQuery<ExperimentFilter, Experiment>({
    queryFunction: getSharedExperiments,
    initialFilter: new ExperimentFilter(),
  });

  const groupQueryData = usePaginatedQuery<ExperimentFilter, Experiment>({
    queryFunction: getGroupExperiments,
    initialFilter: new ExperimentFilter(),
  });

  const ArchivedQueryData = usePaginatedQuery<ExperimentFilter, Experiment>({
    queryFunction: getArchivedExperiments,
    initialFilter: new ExperimentFilter(),
  });

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

  if (isEditingExperiment) {
    return (
        <Layout>
            <ExperimentCreationContainer
                mode="edit"
                initialExperiment={experimentDetailed}
                onSuccess={handleClick}
                onCancel={() => {
                    setEditingExperiment(false);
                    setExperimentDetailed(null);
                }}
            />
        </Layout>
    );
  }

  if (isCreatingExperiment) {
    return (
      <Layout>
        <ExperimentCreationContainer
          mode="create"
          onSuccess={handleClick}
          onCancel={() => setCreatingExperiment(false)}
        />
      </Layout>
    );
  }

  if (experiment && seeArchived) {
    return (
      <Layout>
        <ExperimentContainer experiment={experiment} setExperiment={setExperiment} mode="restricted" />
      </Layout>
    );
  }

  if (experiment) {
  let mode: "allowed" | "restricted" = "allowed";
  if (experiment.userRole === "viewer") {
    mode = "restricted";
  }
    return (
      <Layout>
        <ExperimentContainer experiment={experiment} setExperiment={setExperiment} mode={mode} />
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
              activeKey={activeTab}
              onSelect={(eventKey) => {
                  if (!eventKey) return;
                  setActiveTab(eventKey);
                  if (eventKey === "sharedExperiments") {
                      setLoadSharedExperiments(true);
                  }
              }}
              id="uncontrolled-tab"
          >
            <Tab
            eventKey="userExperiments"
            title="My Experiments"
            className="pt-3"
            unmountOnExit
            >
              <UserExperimentsContainer 
                onExperimentClick={handleClick} 
                mode="user"
                queryData={userQueryData} 
                onExperimentEdit={onExperimentEdit}
              />
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
                  queryData={sharedQueryData}
                  onExperimentEdit={onExperimentEdit}
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
                  queryData={groupQueryData}
                  onExperimentEdit={onExperimentEdit}
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
            <ArchivedExperimentsContainer 
              onExperimentClick={() => {}} 
              mode="archived" 
              experimentSelected={selectedArchivedExperiment} 
              onExperimentSelect={onArchivedExperimentSelect}   
              onExperimentRestored={handleExperimentRestored}
              queryData={ArchivedQueryData}
              onCopyExperiment={handleCopyExperiment}
            />
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

