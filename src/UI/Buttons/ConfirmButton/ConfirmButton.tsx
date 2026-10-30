import { Button } from "react-bootstrap";
import ButtonProps from "../Button.type";

export default function ConfirmButton({onClick}: ButtonProps) {
  return (
    <Button variant="primary" onClick={onClick}>
      Accept
    </Button>
  );
}
