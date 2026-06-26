import { Button } from "react-bootstrap";
import ButtonProps from "../Button.type";

export default function CreateExperimentButton({onClick}: ButtonProps) {
  return (
    <Button variant="primary" onClick={onClick}>
      Create Experiment
    </Button>
  );
}
