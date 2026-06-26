import { Modal } from 'react-bootstrap';
import CancelButton  from "../Buttons/CancelButton/CancelButton";
import ConfirmButton from '../Buttons/ConfirmButton/ConfirmButton';

export interface ConfirmationModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message: string;
  confirmLabel?: string;
  confirmButtonVariant?: string;
  cancelLabel?: string;
  cancelButtonVariant?: string;
}

export const confirmationModalDefaultProps: ConfirmationModalProps =
  Object.freeze({
    message: '',
    show: false,
    onCancel: () => {},
    onConfirm: () => {},
  });

export default function ConfirmationModal({
  show,
  onCancel,
  onConfirm,
  message,
}: ConfirmationModalProps) {
  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <CancelButton onClick={onCancel} />
        <ConfirmButton onClick={onConfirm} />
      </Modal.Footer>
    </Modal>
  );
}
