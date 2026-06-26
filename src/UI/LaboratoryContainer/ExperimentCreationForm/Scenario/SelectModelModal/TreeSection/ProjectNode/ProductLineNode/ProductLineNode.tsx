import { useState } from "react";
import { ChevronRight, ChevronDown } from "react-bootstrap-icons";

import { ProductLine } from "@domain/ProductLineEngineering/Entities/ProductLine";
import { Model } from "@domain/ProductLineEngineering/Entities/Model";

import EngineeringNode from "./EngineeringNode/EngineeringNode";

type ProductLineNodeProps = {
    productLine: ProductLine;
    selectedModel: Model | null;
    onToggleModel: (model: Model, checked: boolean) => void;
};

export default function ProductLineNode({ productLine, selectedModel, onToggleModel }: ProductLineNodeProps) {
    const [expanded, setExpanded] = useState(false);

    const hasModels = productLine.domainEngineering?.models.length > 0 ||
                    productLine.applicationEngineering?.models.length > 0;

    if (!hasModels) {
        return null;
    }

    return (
        <div className="ms-3">
            <div style={{ cursor: "pointer" }} onClick={() => setExpanded(!expanded) }>
                {expanded ? <ChevronDown /> : <ChevronRight /> }
                <span className="ms-2 fw-semibold">
                    {productLine.name}
                </span>
            </div>

            {expanded && (
                <div className="mt-2">
                    <EngineeringNode
                        title="Domain Engineering"
                        models={ productLine.domainEngineering.models}
                        selectedModel={ selectedModel}
                        onToggleModel={ onToggleModel }
                    />

                    <EngineeringNode
                        title="Application Engineering"
                        models={productLine.applicationEngineering.models}
                        selectedModel={ selectedModel }
                        onToggleModel={onToggleModel}
                    />
                </div>
            )}
        </div>
    );
}