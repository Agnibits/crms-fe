import Papa from "papaparse";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export an array of flat objects to CSV.
 * `columns` is optional: [{ key, label }] to control order + headers.
 */
export function exportToCsv(rows, filename = "export.csv", columns) {
  let data = rows;
  if (columns?.length) {
    data = rows.map((row) =>
      Object.fromEntries(columns.map((c) => [c.label, row[c.key] ?? ""]))
    );
  }
  const csv = Papa.unparse(data);
  downloadBlob(new Blob([`﻿${csv}`, ""], { type: "text/csv;charset=utf-8;" }), filename);
}

/** Excel-compatible export (CSV with BOM, .xls extension opens directly in Excel). */
export function exportToExcel(rows, filename = "export.xls", columns) {
  exportToCsv(rows, filename.endsWith(".xls") ? filename : `${filename}.xls`, columns);
}

/** Parse a CSV file (from an <input type="file">) into an array of objects. */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}

/** Export rows to a simple tabular PDF via jsPDF (lazy-loaded). */
export async function exportToPdf({ title, columns, rows, filename = "export.pdf" }) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? "")),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  doc.save(filename);
}
