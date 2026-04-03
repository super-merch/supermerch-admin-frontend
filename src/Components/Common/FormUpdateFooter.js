import React from "react";

const FormUpdateFooter = ({ handleUpdate, handleUpdateCancel }) => {
  return (
    <React.Fragment>
      <div className="hstack gap-2 justify-content-end">
        <button
          type="submit"
          className="btn btn-success"
          id="add-btn"
          onClick={handleUpdate}
        >
          Update
        </button>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleUpdateCancel}
        >
          Cancel
        </button>
      </div>
    </React.Fragment>
  );
};

export default FormUpdateFooter;
