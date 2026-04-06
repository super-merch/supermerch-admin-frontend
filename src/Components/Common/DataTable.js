import React from "react";
import { Table, Input, Spinner } from "reactstrap";

const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  pagination,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
}) => {
  const { currentPage = 1, totalPages = 1, totalCount = 0 } = pagination || {};

  return (
    <div>
      {onSearch && (
        <div className="mb-3">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="form-control-sm"
            style={{ maxWidth: 300 }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner color="primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-muted py-4">No records found</div>
      ) : (
        <div className="table-responsive">
          <Table className="table-hover table-striped align-middle mb-0">
            <thead className="table-light">
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={row._id || ri}>
                  {columns.map((col, ci) => (
                    <td key={ci}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessor
                        ? row[col.accessor]
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted">
            Page {currentPage} of {totalPages} ({totalCount} total)
          </span>
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-light"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 2
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="btn btn-sm disabled">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`btn btn-sm ${
                      p === currentPage ? "btn-primary" : "btn-light"
                    }`}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              className="btn btn-sm btn-light"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
