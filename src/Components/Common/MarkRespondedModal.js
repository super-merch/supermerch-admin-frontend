import React from "react";
import PropTypes from "prop-types";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";

const MarkRespondedModal = ({
  isOpen,
  leadLabel,
  onCancel,
  onConfirm,
  saving,
}) => (
  <Modal isOpen={isOpen} toggle={saving ? undefined : onCancel} centered>
    <ModalHeader toggle={saving ? undefined : onCancel}>
      Confirm response
    </ModalHeader>
    <ModalBody>
      <p className="mb-0">
        Mark <strong>{leadLabel || "this request"}</strong> as responded?
      </p>
      <p className="text-muted mt-2 mb-0">
        Only confirm this after a staff member has replied to the customer.
        This stops the one-business-day unanswered-lead escalation.
      </p>
    </ModalBody>
    <ModalFooter>
      <Button color="light" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button color="success" onClick={onConfirm} disabled={saving}>
        {saving ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            />
            Saving...
          </>
        ) : (
          "Mark Responded"
        )}
      </Button>
    </ModalFooter>
  </Modal>
);

MarkRespondedModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  leadLabel: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

MarkRespondedModal.defaultProps = {
  leadLabel: "",
  saving: false,
};

export default MarkRespondedModal;
