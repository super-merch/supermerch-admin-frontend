/**
 * Shared DataTable custom styles — no text truncation, horizontal scroll.
 * Import and pass as `customStyles` prop to all DataTable instances.
 */
const tableCustomStyles = {
    cells: {
        style: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflow: "visible",
            padding: "8px 12px",
        },
    },
    headCells: {
        style: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            fontWeight: "600",
            padding: "8px 12px",
        },
    },
    rows: {
        style: {
            minHeight: "48px",
        },
    },
};

export default tableCustomStyles;
