import { Button } from "react-bootstrap";
import ButtonProps from "../Button.type";

export default function CancelButton({onClick}: ButtonProps) {
  return (
    <Button variant="secondary" onClick={onClick}>
      Cancel
    </Button>
  );
}
