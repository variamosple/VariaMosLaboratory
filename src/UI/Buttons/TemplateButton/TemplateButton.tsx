import { Button } from "react-bootstrap";
import ButtonProps from "../Button.type";

export default function TemplateButton({onClick}: ButtonProps) {
  return (
    <Button variant="primary" onClick={onClick}>
      Import Template
    </Button>
  );
}
