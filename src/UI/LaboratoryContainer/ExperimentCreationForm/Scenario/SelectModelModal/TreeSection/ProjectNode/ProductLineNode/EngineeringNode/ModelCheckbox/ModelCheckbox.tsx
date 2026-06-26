import { Model } from "@domain/ProductLineEngineering/Entities/Model";

type ModelCheckboxProps = {
    model: Model;
    selected: boolean;
    onToggle: (model: Model, checked: boolean) => void;
};

export default function ModelCheckbox({ model, selected, onToggle }: ModelCheckboxProps) {
    console.log("Model : ", model);
    return (
        <div className="form-check ms-4 d-flex align-items-center">
            <input
                id={`model-${model.id}`}
                className="form-check-input flex-shrink-0"
                type="checkbox"
                checked={selected}
                onChange={(e) => onToggle(model, e.target.checked) }
            />

            <label htmlFor={`model-${model.id}`} className="form-check-label ms-2" style={{ cursor: "pointer" }}>
                {model.name}
            </label>
        </div>
    );
}