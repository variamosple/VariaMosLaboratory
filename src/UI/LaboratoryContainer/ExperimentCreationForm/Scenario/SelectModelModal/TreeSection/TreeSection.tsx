import { ProjectInformation } from "@domain/ProductLineEngineering/Entities/ProjectInformation";
import { Project } from "@domain/ProductLineEngineering/Entities/Project";
import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import ProjectNode from "./ProjectNode/ProjectNode";

type TreeSectionProps = {
    projects: ProjectInformation[];
    loadedProjects: Record< string, Project >;
    onExpandProject: ( project: ProjectInformation ) => void;
    selectedModelIds: string[];
    onToggleModel: ( model: Model, checked: boolean ) => void;
};

export default function TreeSection({ projects, loadedProjects, onExpandProject, selectedModelIds, onToggleModel }: TreeSectionProps) {

    return (
        <div className="mb-3">
            <div className="mt-2">
                {projects.map( (projectInfo) => (
                        <ProjectNode
                            key={ projectInfo.id }
                            projectInfo={ projectInfo }
                            project={ loadedProjects[projectInfo.id]}
                            onExpand={ onExpandProject }
                            selectedModelIds={selectedModelIds}
                            onToggleModel={ onToggleModel }
                        />
                    )
                )}
            </div>
        </div>
    );
}