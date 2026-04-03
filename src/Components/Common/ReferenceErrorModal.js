import React from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Alert,
  Badge,
  ListGroup,
  ListGroupItem,
} from "reactstrap";

const ReferenceErrorModal = ({
  isOpen,
  toggle,
  title = "Cannot Delete Record",
  referenceData,
}) => {
  // Handle different response structures
  const {
    message,
    totalReferences,
    references = [],
    formattedMessage,
    usedInTables = [], // New format
  } = referenceData || {};

  // Normalize data for both old and new formats
  const normalizedReferences = usedInTables.length > 0 
    ? usedInTables.map(item => ({
        model: item.table,
        path: item.field,
        count: item.count
      }))
    : references;

  const totalRefs = totalReferences || normalizedReferences.reduce((sum, ref) => sum + ref.count, 0);

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
      <ModalHeader className="bg-danger text-white" toggle={toggle}>
        <i className="ri-error-warning-line me-2"></i>
        {title}
      </ModalHeader>
      
      <ModalBody>
        <Alert color="warning" className="mb-3">
          <div className="d-flex align-items-center">
            <i className="ri-alert-line me-2 fs-16"></i>
            <div>
              <h6 className="mb-1">Record is Currently in Use</h6>
              <p className="mb-0">{message}</p>
            </div>
          </div>
        </Alert>

        {totalRefs > 0 && (
          <div className="mt-3">
            <h6 className="text-muted mb-3">
              <i className="ri-links-line me-2"></i>
              Reference Details 
              <Badge color="danger" className="ms-2">
                {totalRefs} reference{totalRefs > 1 ? 's' : ''}
              </Badge>
            </h6>
            
            <ListGroup flush>
              {normalizedReferences.map((ref, index) => (
                <ListGroupItem key={index} className="border-start border-danger border-3 ps-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 text-dark">
                        <i className="ri-database-2-line me-2 text-primary"></i>
                        {ref.model}
                      </h6>
                      <small className="text-muted">
                        Field: <code>{ref.path}</code>
                      </small>
                    </div>
                    <Badge color="danger" pill>
                      {ref.count} record{ref.count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </ListGroupItem>
              ))}
            </ListGroup>
          </div>
        )}

        {formattedMessage && (
          <Alert color="info" className="mt-3 mb-0">
            <i className="ri-information-line me-2"></i>
            {formattedMessage}
          </Alert>
        )}
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          <i className="ri-close-line me-1"></i>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ReferenceErrorModal;
