import { useState } from "react";
import { ChevronRight, ChevronDown } from "react-bootstrap-icons";
import { Project } from "@domain/ProductLineEngineering/Entities/Project";
import { ProjectInformation } from "@domain/ProductLineEngineering/Entities/ProjectInformation";
import { Model } from "@domain/ProductLineEngineering/Entities/Model";
import ProductLineNode from "./ProductLineNode/ProductLineNode";

type ProjectNodeProps = {
    projectInfo: ProjectInformation;
    project?: Project;
    onExpand: (projectInfo: ProjectInformation) => void;
    selectedModel: Model | null;
    onToggleModel: (model: Model, checked: boolean) => void;
};

export default function ProjectNode({ projectInfo, project, onExpand, selectedModel, onToggleModel }: ProjectNodeProps) {
    const [expanded, setExpanded] = useState(false);
    
    const selectedLength = project? project.productLines.reduce(
        (count, pl) =>
            count + (selectedModel && [
                ...(pl.domainEngineering?.models ?? []),
                ...(pl.applicationEngineering?.models ?? []),
            ].some((model) => model.id === selectedModel.id) ? 1 : 0), 0
        ) : 0;

    const handleToggleModel = ( model: Model, checked: boolean ) => {
        onToggleModel(model, checked);
    };

    const handleClick = () => { 
        const next = !expanded;
        setExpanded(next);
        if (next && !project) {
            onExpand(projectInfo);
        }
    };
    const authors = projectInfo.author
    ?.split(/\),\s*/)
    .map(a => a.trim())
    .filter(Boolean);

    const shortAuthor =
        authors && authors.length > 1
            ? `${authors[0]}) +${authors.length - 1}`
            : authors?.[0] ?? "";

    return (
        <div className="mb-2 border rounded p-2" style={{ backgroundColor: "#f8f9fa",overflow: "hidden" }}>
            <div
                className="d-flex align-items-start"
                style={{ cursor: "pointer" }}
                onClick={handleClick}
            >
                <span className="flex-shrink-0 mt-1">
                    {expanded ? <ChevronDown /> : <ChevronRight />}
                </span>

                <div className="ms-2 flex-grow-1 min-w-0">
                    <div className="fw-bold text-truncate">
                        {projectInfo.name}
                    </div>

                    <div className="d-flex flex-wrap align-items-center text-muted fw-normal small">
                        <span
                            className="text-truncate"
                            title={projectInfo.author}
                        >
                            {shortAuthor}
                        </span>

                        <span className="ms-2 flex-shrink-0 text-nowrap">
                            {new Date(projectInfo.date).toLocaleDateString()}
                        </span>
                        
                        {selectedLength > 0 && (
                            <span className="ms-auto text-primary">
                                selected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {expanded &&
                project &&
                project.productLines.map((pl) => (
                    <ProductLineNode
                        key={pl.id}
                        productLine={pl}
                        selectedModel={selectedModel}
                        onToggleModel={handleToggleModel}
                    />
                ))}
        </div>
    );
}