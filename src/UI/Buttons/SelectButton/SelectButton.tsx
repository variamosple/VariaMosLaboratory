import { Button } from "react-bootstrap";
import ButtonProps from "../Button.type";
import "./SelectButton.css";
import "../../../index.css";

type SelectableItem = {
    name: string;
};

interface SelectButtonProps extends ButtonProps {
    content?: SelectableItem[];
    label: string;
}

const MAX_VISIBLE_ITEMS = 5;

export default function SelectButton({
    onClick,
    label,
    content = [],
}: SelectButtonProps) {
    const safeContent = content.filter(
        (item): item is SelectableItem => item != null && typeof item.name === "string"
    );

    const visibleItems = safeContent.slice(0, MAX_VISIBLE_ITEMS);
    const remainingCount = safeContent.length - MAX_VISIBLE_ITEMS;

    return (
        <Button
            className="btn-select w-100 py-3 text-center"
            onClick={onClick}
        >
            <div className="select-button-label">
                {label}
            </div>

            {safeContent.length > 0 && (
                <div className="small text-muted mt-1">
                    {visibleItems.map((item, index) => (
                        <span key={index}>
                            {item.name}
                            {index < visibleItems.length - 1 && ", "}
                        </span>
                    ))}

                    {remainingCount > 0 && (
                        <span className="more">
                            {` +${remainingCount} more`}
                        </span>
                    )}
                </div>
            )}
        </Button>
    );
}