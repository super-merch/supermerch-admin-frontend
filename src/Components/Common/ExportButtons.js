import React, { useState } from "react";
import { Button, ButtonGroup, Spinner } from "reactstrap";
import { CSVLink } from "react-csv";
import { toast } from "react-toastify";
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
 * Excel worksheet names are limited to 31 characters and cannot contain
 * : \ / ? * [ ]. SheetJS enforces the length by THROWING, and the throw here
 * was caught and logged, so the Excel button silently did nothing.
 *
 * That was not hypothetical: "sales-report-revenue-by-supplier" is 32
 * characters, so that report's Excel export never worked, while its CSV and
 * PDF did. "sales-report-revenue-by-product" is 31 - one character from the
 * same fate - which is why this is a rule and not a rename.
 *
 * The FILE name is left alone; only the sheet tab inside it is shortened.
 */
export const toSheetName = (name) => {
    const cleaned = String(name || "Sheet1").replace(/[:\\/?*[\]]/g, "-");
    return cleaned.length > 31 ? cleaned.slice(0, 31) : cleaned || "Sheet1";
};

// Australian business, so an Australian date. new Date().toLocaleString() with
// no arguments follows the machine's locale, which put "8/26/2026, 12:16:00 PM"
// on an Australian report opened from a US-configured laptop. Pinning the zone
// as well as the locale means the stamp says when it was exported in the
// business's own time, not the exporter's.
export const exportedStamp = () =>
    new Date().toLocaleString("en-AU", {
        timeZone: "Australia/Sydney",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

/**
 * Build the workbook for an Excel export.
 *
 * Separate from the click handler so it can be tested without a browser, a
 * click or a file download - see ExportButtons.test.js, which measures the two
 * failures this function exists to prevent rather than asserting them.
 */
export const buildWorkbook = (rows, headers, numericHeaders, fileName) => {
    // Pass the header list explicitly. json_to_sheet infers headers from the
    // objects' own keys, so a report with zero rows produced a completely blank
    // worksheet - no headings at all - while the CSV and PDF of the same empty
    // report still carried them. A filter covering a period with no orders is
    // an ordinary way to hit that, and a blank file is indistinguishable from a
    // broken export.
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

    // Give numeric columns a two-decimal DISPLAY format rather than rounding
    // the values themselves. The cells stay full-precision numbers, so SUM()
    // over the exported rows reconciles with the total shown on screen, which
    // is computed from the same unrounded figures. Rounding each row first is
    // what made the spreadsheet disagree with the report by a cent.
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
        if (!numericHeaders.has(headers[c - range.s.c])) continue;
        for (let r = range.s.r + 1; r <= range.e.r; r++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.t === "n") cell.z = "#,##0.00";
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, toSheetName(fileName));
    return wb;
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
// are unaffected.
//
// What callers pass matters, and a loading flag alone is NOT enough. Two
// separate holes were found by review:
//
//   - A page whose data is refetched by a filter must also pass "the data on
//     screen belongs to the filter on screen" (SalesReports compares an applied
//     filter key), because `loading` is false in the gap between the user
//     changing the filter and the refetch starting.
//   - A page must pass "a request has actually succeeded", not just "a request
//     has finished". On failure these pages leave their initial empty array in
//     place and clear loading, so export lit up over an empty report that looks
//     exactly like a legitimate empty period.
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

    const readPath = (row, key) =>
        key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), row);

    const prepareRows = (rawData) => {
        const allCols = buildAllColumns(rawData);

        // Work out each column's fill value ONCE, up front.
        //
        // This used to run rawData.find(...) for every null cell, scanning the
        // whole dataset each time. On a column that is null throughout, that is
        // O(rows squared): a few thousand rows spent seconds here before any
        // file was generated. One pass per column instead.
        const fillByHeader = new Map();
        const numericHeaders = new Set();
        for (const col of allCols) {
            let sample = null;
            for (const r of rawData) {
                const v = readPath(r, col.key);
                if (v !== null && v !== undefined) { sample = v; break; }
            }
            const isNumeric = typeof sample === "number";
            if (isNumeric) numericHeaders.add(col.header);
            fillByHeader.set(col.header, isNumeric ? 0 : "null");
        }

        const rows = rawData.map((row) => {
            const obj = {};
            allCols.forEach((col) => {
                let val = readPath(row, col.key);
                if (val === null || val === undefined) {
                    val = fillByHeader.get(col.header);
                }
                if (typeof val === "boolean") val = val ? "Yes" : "No";
                if (Array.isArray(val)) val = val.join(", ");
                if (typeof val === "object" && val !== null) val = JSON.stringify(val);
                obj[col.header] = val;
            });
            return obj;
        });

        return { rows, columns: allCols, numericHeaders };
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
            const { rows, columns: allCols, numericHeaders } = prepareRows(allData);
            const wb = buildWorkbook(
                rows,
                allCols.map((c) => c.header),
                numericHeaders,
                fileName
            );
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        } catch (err) {
            console.error("Excel export error:", err);
            toast.error("Excel export failed. Nothing was downloaded.");
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
            doc.text(`Exported: ${exportedStamp()}`, 14, 21);

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
            toast.error("PDF export failed. Nothing was downloaded.");
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
