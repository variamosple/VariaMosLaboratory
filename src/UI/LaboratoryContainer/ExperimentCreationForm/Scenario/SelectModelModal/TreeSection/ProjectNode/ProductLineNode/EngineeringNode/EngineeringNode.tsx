import { useState } from "react";
import { ChevronRight, ChevronDown } from "react-bootstrap-icons";

import { Model } from "@domain/ProductLineEngineering/Entities/Model";

import ModelCheckbox from "./ModelCheckbox/ModelCheckbox";

type EngineeringNodeProps = {
    title: string;
    models: Model[];
    selectedModel: Model | null;
    onToggleModel: (model: Model, checked: boolean) => void;
};

export default function EngineeringNode({ title, models, selectedModel, onToggleModel }: EngineeringNodeProps) {
    const [expanded, setExpanded] = useState(false);

    if (!models.length) {
        return null;
    }

    return (
        <div className="ms-3">
            <div style={{ cursor: "pointer" }} onClick={() => setExpanded(!expanded)} >
                {expanded ? <ChevronDown /> : <ChevronRight /> }
                <span className="ms-2">
                    {title}
                </span>
            </div>

            {expanded && (
                <div className="mt-1">
                    {models.map((model) => (
                        <ModelCheckbox
                            key={model.id}
                            model={model}
                            selected={selectedModel?.id === model.id}
                            onToggle={ onToggleModel }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}