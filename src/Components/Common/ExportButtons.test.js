import * as XLSX from "xlsx";
import { toSheetName, exportedStamp, buildWorkbook, formatForPdf } from "./ExportButtons";

// These four Reports exports go to the accountant, so a rounding error or a
// silently missing file is a real defect rather than a nitpick. Each test below
// measures a failure that actually happened, so a regression shows the number
// rather than just going red.

const sheetOf = (wb) => wb.Sheets[wb.SheetNames[0]];

describe("Excel worksheet names", () => {
    // Worksheet names are capped at 31 characters and SheetJS enforces it by
    // THROWING. The throw was caught and logged, so the Excel button on
    // Revenue by Supplier silently did nothing while its CSV and PDF worked.
    it("shortens the name that used to throw", () => {
        const name = "sales-report-revenue-by-supplier";
        expect(name.length).toBe(32); // the length is the whole bug

        // Proof the old code really did fail, so this test cannot quietly
        // become vacuous if the library changes.
        expect(() =>
            XLSX.utils.book_append_sheet(
                XLSX.utils.book_new(),
                XLSX.utils.json_to_sheet([{ a: 1 }]),
                name
            )
        ).toThrow(/31/);

        const wb = buildWorkbook([{ Revenue: 1 }], ["Revenue"], new Set(["Revenue"]), name);
        expect(wb.SheetNames[0]).toHaveLength(31);
    });

    it("leaves a name that already fits alone", () => {
        // 31 characters exactly - one from the same fate, which is why this is
        // a rule and not a rename.
        const name = "sales-report-revenue-by-product";
        expect(name).toHaveLength(31);
        expect(toSheetName(name)).toBe(name);
    });

    it("replaces the characters Excel forbids", () => {
        expect(toSheetName("a/b:c?d*e[f]g")).toBe("a-b-c-d-e-f-g");
    });

    it("never returns an empty name", () => {
        expect(toSheetName("")).toBe("Sheet1");
        expect(toSheetName(null)).toBe("Sheet1");
    });
});

describe("an empty report", () => {
    // A filter covering a period with no orders is an ordinary thing to do.
    it("still carries its column headings", () => {
        const headers = ["Supplier", "Revenue", "Orders"];
        const ws = sheetOf(buildWorkbook([], headers, new Set(["Revenue", "Orders"]), "empty"));
        expect(XLSX.utils.sheet_to_csv(ws).trim()).toBe("Supplier,Revenue,Orders");
    });

    it("used to produce a completely blank worksheet", () => {
        // json_to_sheet infers headers from the objects' keys, and zero rows
        // have no keys. A blank file is indistinguishable from a broken export.
        expect(XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet([])).trim()).toBe("");
    });
});

describe("exported figures reconcile with the report on screen", () => {
    // The summary cards sum the RAW values and format once at the end. If the
    // export rounds each row first, the accountant's SUM() disagrees with the
    // report they exported it from, and there is no total row to explain it.
    const RAW = 2173.7870000000003;

    it("writes values unrounded, so SUM matches the displayed total", () => {
        const ws = sheetOf(
            buildWorkbook([{ Revenue: RAW }, { Revenue: RAW }], ["Revenue"], new Set(["Revenue"]), "x")
        );
        expect(ws.A2.v).toBe(RAW);
        expect(ws.A3.v).toBe(RAW);

        const onScreen = (RAW + RAW).toFixed(2);
        const exportedSum = (ws.A2.v + ws.A3.v).toFixed(2);
        expect(exportedSum).toBe(onScreen);
        expect(exportedSum).toBe("4347.57");
    });

    it("shows the cent that the old per-row rounding lost", () => {
        // The helper that used to do this, in its final and best form.
        const money = (n) => {
            const sign = n < 0 ? -1 : 1;
            return sign * (Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100);
        };
        expect((money(RAW) + money(RAW)).toFixed(2)).toBe("4347.58");
        expect((RAW + RAW).toFixed(2)).toBe("4347.57");
        // One cent, silently, on every report with values like these.
    });

    it("keeps numeric cells numeric and formats them for display only", () => {
        const ws = sheetOf(
            buildWorkbook(
                [{ Supplier: "Acme", Revenue: RAW }],
                ["Supplier", "Revenue"],
                new Set(["Revenue"]),
                "x"
            )
        );
        expect(ws.B2.t).toBe("n"); // must stay a number or SUM() breaks
        expect(ws.B2.z).toBe("#,##0.00");
        expect(ws.A2.z).toBeUndefined(); // text columns are left alone
    });
});

describe("the export timestamp", () => {
    it("is Australian regardless of the machine's locale", () => {
        // toLocaleString() with no arguments follows the machine, which put
        // "8/26/2026, 12:16:00 PM" on an Australian report opened from a
        // US-configured laptop.
        expect(exportedStamp()).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/);
    });
});

describe("PDF presentation", () => {
    // This is the regression that escaped round three. Deleting money() was the
    // right fix for the DATA exports, but that helper was also — incidentally —
    // the only thing formatting the PDF. Excel got a replacement presentation
    // layer in the same change (cell.z) and the PDF got nothing, so an
    // accountant-facing document could print 2173.7870000000003.
    //
    // The previous test file tested Excel cells, sheet names, empty headers and
    // the timestamp. It never rendered a PDF value, which is exactly why this
    // got through.
    it("prints money at two decimals, not raw floating point", () => {
        expect(formatForPdf(2173.7870000000003)).toBe("2,173.79");
        expect(formatForPdf(0.1 + 0.2)).toBe("0.30");
        expect(formatForPdf(1000.005)).toMatch(/^1,000\.0[01]$/);
    });

    it("leaves whole numbers whole", () => {
        // Counts and quantities are integers. "Orders: 5.00" is its own small
        // nonsense, so only fractional values get the money treatment.
        expect(formatForPdf(5)).toBe("5");
        expect(formatForPdf(12345)).toBe("12,345");
        expect(formatForPdf(0)).toBe("0");
    });

    it("passes non-numbers through unchanged", () => {
        expect(formatForPdf("Acme Pty Ltd")).toBe("Acme Pty Ltd");
        expect(formatForPdf(null)).toBe("");
        expect(formatForPdf(undefined)).toBe("");
        expect(formatForPdf(NaN)).toBe("NaN");
    });

    it("keeps the raw value out of the PDF but IN the spreadsheet", () => {
        // The two outputs deliberately disagree, and that is the whole design:
        // the spreadsheet keeps full precision so SUM() reconciles with the
        // report, the PDF shows a figure a human can read.
        const raw = 2173.7870000000003;
        const ws = sheetOf(buildWorkbook([{ Revenue: raw }], ["Revenue"], new Set(["Revenue"]), "x"));
        expect(ws.A2.v).toBe(raw);
        expect(formatForPdf(raw)).toBe("2,173.79");
    });
});
