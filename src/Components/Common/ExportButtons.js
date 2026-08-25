import React, { useState } from "react";
import { Button, ButtonGroup, Spinner } from "reactstrap";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

// Keys to always exclude from export (images, internal fields, action columns)
const EXCLUDED_KEY_PATTERNS = [
    "image", "img", "photo", "avatar", "logo", "thumbnail", "banner", "icon",
    "hero", "picture", "profilepic", "profileimage", "__v", "_id", "password",
    "salt", "hash", "token", "otp", "resettoken", "refreshtoken",
];

const isExcludedKey = (key) => {
    const lower = key.toLowerCase().replace(/[._-]/g, "");
    return EXCLUDED_KEY_PATTERNS.some((p) => lower.includes(p));
};

/** Flatten nested object keys with dot notation */
const flattenObject = (obj, prefix = "") => {
    const result = {};
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return result;
    for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
            Object.assign(result, flattenObject(val, fullKey));
        } else {
            result[fullKey] = val;
        }
    }
    return result;
};

/** Turn a dot-path key into a readable header: "overview.name" → "Overview Name" */
const formatHeader = (key) => {
    const last = key.includes(".") ? key.split(".").pop() : key;
    return last
        .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → camel Case
        .replace(/[_.-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
};

/**
 * Reusable Export Buttons component for CSV, Excel, and PDF export.
 *
 * Props:
 *  - data: Array of objects (current page data, used as fallback)
 *  - columns: Array of { header: string, key: string } defining export columns
 *  - fileName: string (without extension)
 *  - fetchAll: async () => Array — optional function to fetch ALL records for export
 *
 * Columns auto-detection: The component automatically discovers ALL keys from data,
 * merges with explicitly provided columns, and excludes image/internal fields.
 */
// `disabled` is optional and defaults to false, so the ~29 existing call sites
// are unaffected. Pages whose data is refetched by a filter pass their loading
// flag, so an export cannot capture rows for a filter the user has moved past.
const ExportButtons = ({ data = [], columns = [], fileName = "export", fetchAll, disabled = false }) => {
    const [exporting, setExporting] = useState(false);
    const csvLinkRef = React.useRef(null);
    const [csvData, setCsvData] = useState([]);

    const getAllData = async () => {
        if (fetchAll) {
            setExporting(true);
            try {
                const allData = await fetchAll();
                return allData || data;
            } catch (err) {
                console.error("Export fetch error:", err);
                return data;
            } finally {
                setExporting(false);
            }
        }
        return data;
    };

    /** Build the full column list: explicit columns first, then auto-detected ones */
    const buildAllColumns = (rawData) => {
        // Collect all keys from all rows (flattened)
        const allKeysSet = new Set();
        rawData.forEach((row) => {
            const flat = flattenObject(row);
            Object.keys(flat).forEach((k) => allKeysSet.add(k));
        });

        // Start with explicitly provided columns
        const explicitKeys = new Set(columns.map((c) => c.key));
        const merged = [...columns];

        // Add auto-detected keys that aren't already covered
        for (const key of allKeysSet) {
            if (explicitKeys.has(key)) continue;
            if (isExcludedKey(key)) continue;
            merged.push({ header: formatHeader(key), key });
        }

        return merged;
    };

    const prepareRows = (rawData) => {
        const allCols = buildAllColumns(rawData);
        return { rows: rawData.map((row) => {
            const obj = {};
            allCols.forEach((col) => {
                let val = col.key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), row);
                if (val === null || val === undefined) {
                    // Determine default based on whether any row has a numeric value for this key
                    const sampleVal = rawData.find((r) => {
                        const v = col.key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), r);
                        return v !== null && v !== undefined;
                    });
                    if (sampleVal) {
                        const sample = col.key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), sampleVal);
                        val = typeof sample === "number" ? 0 : "null";
                    } else {
                        val = "null";
                    }
                }
                if (typeof val === "boolean") val = val ? "Yes" : "No";
                if (Array.isArray(val)) val = val.join(", ");
                if (typeof val === "object" && val !== null) val = JSON.stringify(val);
                obj[col.header] = val;
            });
            return obj;
        }), columns: allCols };
    };

    const [csvHeaders, setCsvHeaders] = useState([]);

    const handleCSV = async () => {
        const allData = await getAllData();
        const { rows, columns: allCols } = prepareRows(allData);
        setCsvHeaders(allCols.map((c) => ({ label: c.header, key: c.header })));
        setCsvData(rows);
        setTimeout(() => {
            csvLinkRef.current?.link?.click();
        }, 100);
    };

    const handleExcel = async () => {
        setExporting(true);
        try {
            const allData = await getAllData();
            const { rows } = prepareRows(allData);
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, fileName);
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        } catch (err) {
            console.error("Excel export error:", err);
        } finally {
            setExporting(false);
        }
    };

    const handlePDF = async () => {
        setExporting(true);
        try {
            const allData = await getAllData();
            const { rows, columns: allCols } = prepareRows(allData);
            const doc = new jsPDF("l", "mm", "a4");
            doc.setFontSize(14);
            doc.text(fileName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), 14, 15);
            doc.setFontSize(8);
            doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 21);

            const headers = allCols.map((c) => c.header);
            const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));

            autoTable(doc, {
                head: [headers],
                body,
                startY: 25,
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 7 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 10, right: 10 },
                tableWidth: "auto",
            });

            doc.save(`${fileName}.pdf`);
        } catch (err) {
            console.error("PDF export error:", err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="d-inline-flex align-items-center gap-2">
            {exporting && <Spinner size="sm" color="secondary" />}
            <ButtonGroup size="sm">
                <Button color="soft-success" onClick={handleCSV} disabled={exporting || disabled} title="Export CSV">
                    <i className="ri-file-text-line me-1"></i>CSV
                </Button>
                <Button color="soft-primary" onClick={handleExcel} disabled={exporting || disabled} title="Export Excel">
                    <i className="ri-file-excel-2-line me-1"></i>Excel
                </Button>
                <Button color="soft-danger" onClick={handlePDF} disabled={exporting || disabled} title="Export PDF">
                    <i className="ri-file-pdf-line me-1"></i>PDF
                </Button>
            </ButtonGroup>
            <CSVLink
                ref={csvLinkRef}
                data={csvData}
                headers={csvHeaders}
                filename={`${fileName}.csv`}
                className="d-none"
            />
        </div>
    );
};

export default ExportButtons;
