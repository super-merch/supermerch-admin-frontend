import React from "react";


const FormsFooter = ({ handleSubmit, handleSubmitCancel }) => {
  return (
    <React.Fragment>
      <div className="hstack gap-2 justify-content-end">
        <button
          type="submit"
          className="btn btn-success"
          id="add-btn"
          onClick={handleSubmit}
        >
          Submit
        </button>
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleSubmitCancel}
        >
          Cancel
        </button>
      </div>
    </React.Fragment>
  );
};

export default FormsFooter;
