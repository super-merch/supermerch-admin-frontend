import React from "react";
import { Button, Input, Label, Row, Col } from "reactstrap";
import ExportButtons from "./ExportButtons";

/**
 * Reusable PageHeader component for consistent layout across all master pages
 *
 * Features:
 * - Page title display
 * - Active filter checkbox
 * - Add button (optional)
 * - Search input
 * - Export buttons (CSV, Excel, PDF)
 * - Responsive alignment matching design system
 *
 * @param {Object} props
 * @param {string} props.formName - Page title to display
 * @param {boolean} props.filter - Active filter state
 * @param {Function} props.handleFilter - Handler for filter checkbox
 * @param {Function} props.setQuery - Handler for search input
 * @param {Object} props.initialState - Initial form state (for reset on List button)
 * @param {Function} props.setValues - Setter for form values
 * @param {boolean} props.updateForm - Whether update form is shown
 * @param {boolean} props.showForm - Whether add form is shown
 * @param {Function} props.setShowForm - Setter for showForm state
 * @param {Function} props.setUpdateForm - Setter for updateForm state
 * @param {Function} props.openAddForm - Custom handler for Add button (optional)
 * @param {Function} props.tog_list - Custom handler for List button (optional)
 * @param {boolean} props.showAddButton - Whether to show Add button (default: true)
 * @param {Array} props.data - Current page data for export
 * @param {Array} props.exportColumns - Column definitions for export
 * @param {string} props.fileName - File name for exports
 * @param {Function} props.fetchAllForExport - Function to fetch all data for export (optional)
 */
const PageHeader = ({
  formName,
  filter,
  handleFilter,
  setQuery,
  searchValue,
  initialState,
  setValues,
  updateForm,
  showForm,
  setShowForm,
  setUpdateForm,
  openAddForm,
  tog_list,
  showAddButton = true,
  data = [],
  exportColumns = [],
  fileName = "export",
  fetchAllForExport,
}) => {
  const isFormMode = showForm || updateForm;

  const handleListClick = () => {
    if (tog_list) {
      tog_list();
    } else {
      if (setValues && initialState) {
        setValues(initialState);
      }
      if (setUpdateForm) {
        setUpdateForm(false);
      }
      if (setShowForm) {
        setShowForm(false);
      }
    }
  };

  const handleAddClick = () => {
    if (openAddForm) {
      openAddForm();
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="page-header-wrapper">
      {/* Main Row: Title on left, Controls on right */}
      <Row className="align-items-center mb-3">
        {/* Page Title */}
        <Col xs={12} md={4} lg={3}>
          <h2 className="card-title mb-0 fs-4">{formName}</h2>
        </Col>

        {/* Controls Section (Right-aligned) */}
        <Col xs={12} md={8} lg={9}>
          <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
            {!isFormMode ? (
              <>
                {/* Active Filter Checkbox */}
                <div className="d-flex align-items-center">
                  <Input
                    type="checkbox"
                    className="form-check-input"
                    name="filter"
                    id="active-filter"
                    checked={filter}
                    onChange={handleFilter}
                  />
                  <Label className="form-check-label ms-2 mb-0" htmlFor="active-filter">
                    Active
                  </Label>
                </div>

                {/* Add Button */}
                {showAddButton && (
                  <Button color="success" className="add-btn" onClick={handleAddClick}>
                    <i className="ri-add-line align-bottom me-1"></i>
                    Add
                  </Button>
                )}

                {/* Search Input */}
                <div className="search-box position-relative">
                  <input
                    className="form-control search"
                    placeholder="Search..."
                    {...(searchValue !== undefined ? { value: searchValue } : {})}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <i className="ri-search-line search-icon"></i>
                </div>
              </>
            ) : (
              /* List Button (Form Mode) */
              <Button color="success" onClick={handleListClick}>
                <i className="ri-list-check align-bottom me-1"></i> List
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Export Buttons Row (Below controls, right-aligned) */}
      {!isFormMode && (data || exportColumns.length > 0) && (
        <Row>
          <Col xs={12}>
            <div className="d-flex justify-content-end mb-2">
              <ExportButtons
                data={data}
                columns={exportColumns}
                fileName={fileName}
                fetchAll={fetchAllForExport}
              />
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default PageHeader;
