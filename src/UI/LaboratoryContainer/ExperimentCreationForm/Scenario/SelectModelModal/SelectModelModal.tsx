import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Button, Tabs, Tab, Alert, Spinner } from "react-bootstrap";
import { useSession } from "@variamosple/variamos-components/dist/Context/SessionContext";
import ProjectPersistenceService from "../../../../../DataProvider/Services/projectPersistenceService";

import { ProjectInformation } from "../../../../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { Project } from "../../../../../Domain/ProductLineEngineering/Entities/Project";
import { Model } from "../../../../../Domain/ProductLineEngineering/Entities/Model";

import TreeSection from "./TreeSection/TreeSection";
import "./SelectModelModal.css";
import CancelButton from "../../../../Buttons/CancelButton/CancelButton";

type SelectModelModalProps = {
    show: boolean;
    onClose: () => void;
    setSelectedModel: (model: Model) => void;
    selectedModel: Model | null;
};

export default function SelectModelModal({ show, onClose, setSelectedModel, selectedModel }: SelectModelModalProps) {
    const { user } = useSession();
    const projectService = useMemo(() => new ProjectPersistenceService(), []);

    const [activeTab, setActiveTab] = useState("privateProjects");
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState("");
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [ownedProjects, setOwnedProjects] = useState<ProjectInformation[]>([]);
    const [sharedProjects, setSharedProjects] = useState<ProjectInformation[]>([]);
    const [publicProjects, setPublicProjects] = useState<ProjectInformation[]>([]);
    const [loadedProjects, setLoadedProjects] = useState<Record<string, Project>>({});
    const [selectedModelState, setSelectedModelState] = useState<Model | null>(null);
    const [hasLoadedProjects, setHasLoadedProjects] = useState(false);

    useEffect(() => {
        setUserId(user?.id || "");
    }, [user]);

    useEffect(() => {
        setSelectedModelState(selectedModel);
    }, [selectedModel]);
    

    const loadProjects = useCallback(async (projects: ProjectInformation[], setter: React.Dispatch<React.SetStateAction<ProjectInformation[]>> ) => {
        const validProjects: ProjectInformation[] = [];

        await Promise.all(
            projects.map((projectInfo) => new Promise<void>((resolve) => {
                projectService.openProject(
                    userId, 
                    projectInfo.id, (fullProject: any) => {
                    const project = fullProject.project;
                        if (projectHasModels(project)) {
                            validProjects.push(projectInfo);
                            setLoadedProjects((prev) => ({
                                    ...prev, 
                                    [projectInfo.id]: project,
                                }));
                        }
                        resolve();
                    },
                    () => resolve()
                );
            }))
        );
        setter(validProjects);
    }, [userId, projectService]);

    useEffect(() => {
        if (!show || !userId || hasLoadedProjects) {
            return;
        }

        const loadAllProjects = async () => {
            setIsLoadingProjects(true);

            try {
                const privateResponse =
                    await new Promise<any>((resolve, reject) =>
                        projectService.getProjectsByUser(userId, resolve, reject)
                    );

                const publicResponse =
                    await new Promise<ProjectInformation[]>(
                        (resolve, reject) =>
                            projectService.getTemplateProjectsByUser(
                                userId,
                                resolve,
                                reject
                            )
                    );

                await loadProjects(privateResponse.owned_projects, setOwnedProjects);
                await loadProjects(privateResponse.shared_projects, setSharedProjects);
                await loadProjects(publicResponse, setPublicProjects);

                setHasLoadedProjects(true);
            } finally {
                setIsLoadingProjects(false);
            }
        };

        loadAllProjects();
    }, [show, userId, hasLoadedProjects, loadProjects, projectService]);

    const projectHasModels = ( project: Project ) =>
        project.productLines.some((pl) =>
                (pl.scope?.models?.length ?? 0) > 0 ||
                (pl.domainEngineering?.models?.length ?? 0) > 0 ||
                (pl.applicationEngineering?.models?.length ?? 0) > 0
        );


    const handleExpandProject = (projectInfo: ProjectInformation) => {
        if (loadedProjects[projectInfo.id]) {
            return;
        }

        projectService.openProject(
            userId,
            projectInfo.id,
            (fullProject: any) =>
                setLoadedProjects(
                    (prev) => ({
                        ...prev,
                        [projectInfo.id]: fullProject.project,
                    })
                ),
            console.error
        );
    };

    const toggleModel = (model: Model, checked: boolean ) => {
        setSelectedModelState((prev) => checked ? model : null);
    };

    const filterProjects = ( projects: ProjectInformation[]) =>
        !searchTerm? projects: projects.filter((p) => p.name
            .toLowerCase()
            .includes(
                searchTerm.toLowerCase()
            ));

    const currentProjects = activeTab === "privateProjects" ? ownedProjects : activeTab === "sharedProjects"? sharedProjects : publicProjects;

    const filteredProjects = filterProjects(currentProjects);
    return (
        <Modal show={show} onHide={onClose} size="xl" dialogClassName="custom-modal-height">
            <Modal.Header closeButton>
                <Modal.Title>
                    Select Models
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex flex-column flex-lg-row gap-3 mb-3">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => k && setActiveTab(k)}
                        className="mb-0 flex-shrink-0"
                    >
                        <Tab eventKey="privateProjects" title="Personal"/>
                        <Tab eventKey="sharedProjects" title="Shared"/>
                        <Tab  eventKey="publicProjects" title="Public"/>
                    </Tabs>

                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search project..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value) }
                    />
                </div>

                {isLoadingProjects ? (
                    <div className="text-center py-5">
                        <Spinner animation="border"/>
                        <div className="mt-3">
                            Loading projects...
                        </div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <Alert variant="info">
                        No projects or model found
                    </Alert>
                ) : (
                    <TreeSection
                        projects={ filteredProjects }
                        loadedProjects={ loadedProjects }
                        onExpandProject={ handleExpandProject }
                        selectedModel={ selectedModelState }
                        onToggleModel={ toggleModel }
                    />
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="primary"
                    onClick={() => {
                        setSelectedModel(selectedModelState);
                        onClose();
                    }}
                    disabled={selectedModelState === null}
                >
                    Apply {selectedModelState && `(${selectedModelState.name})`}
                </Button>
                <CancelButton onClick={() => {onClose(); setSelectedModelState(selectedModel);}}/>
                <Button 
                    variant="danger" 
                    onClick={() => {
                            setSelectedModelState(null); 
                            setSelectedModel(null);
                        }} 
                    disabled={selectedModelState === null}
                >
                    Clear
                </Button>
            </Modal.Footer>
        </Modal>
    );
}