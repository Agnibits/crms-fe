"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/utils/format";
import { findOption, INVOICE_STATUSES } from "@/constants/options";

const BRAND = [79, 70, 229]; // indigo-600 — matches exportToPdf header color
const MUTED = [107, 114, 128];

/**
 * Lazy-loads jspdf + jspdf-autotable and generates a styled, downloadable
 * PDF for an invoice.
 *
 *   const { downloadPdf, isGenerating } = useInvoicePdf();
 *   downloadPdf(invoice);
 */
export function useInvoicePdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  async function downloadPdf(invoice) {
    if (!invoice) return;
    setIsGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;

      /* Brand header band */
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, pageWidth, 90, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("AgniBits CRM", margin, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("4th Floor, Tech Park One, Pune, India", margin, 56);
      doc.text("hello@agnibits.com  ·  +91 9876543210", margin, 68);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("INVOICE", pageWidth - margin, 42, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(String(invoice.number ?? ""), pageWidth - margin, 60, { align: "right" });

      /* Meta + bill-to */
      let y = 120;
      doc.setTextColor(...MUTED);
      doc.setFontSize(8.5);
      doc.text("BILL TO", margin, y);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(String(invoice.customerName ?? "—"), margin, y + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(`Customer ID: ${invoice.customerId ?? "—"}`, margin, y + 30);

      const statusLabel =
        findOption(INVOICE_STATUSES, invoice.status)?.label ?? String(invoice.status ?? "");
      const metaRows = [
        ["Issue Date", formatDate(invoice.createdAt)],
        ["Due Date", formatDate(invoice.dueDate)],
        ["Status", statusLabel],
      ];
      doc.setFontSize(9);
      metaRows.forEach(([label, value], i) => {
        const rowY = y + i * 14;
        doc.setTextColor(...MUTED);
        doc.text(label, pageWidth - margin - 120, rowY);
        doc.setTextColor(20, 20, 20);
        doc.text(String(value), pageWidth - margin, rowY, { align: "right" });
      });

      /* Line items */
      autoTable(doc, {
        startY: y + 50,
        margin: { left: margin, right: margin },
        head: [["Item", "Qty", "Unit Price", "Amount"]],
        body: (invoice.items ?? []).map((item) => [
          item.productName ?? "",
          String(item.quantity ?? ""),
          formatCurrency(item.unitPrice),
          formatCurrency(item.total),
        ]),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: BRAND, fontSize: 8.5 },
        columnStyles: {
          1: { halign: "right", cellWidth: 50 },
          2: { halign: "right", cellWidth: 90 },
          3: { halign: "right", cellWidth: 90 },
        },
      });

      /* Totals block */
      let totalsY = (doc.lastAutoTable?.finalY ?? y + 50) + 18;
      const labelX = pageWidth - margin - 180;
      const valueX = pageWidth - margin;
      const totals = [
        ["Subtotal", formatCurrency(invoice.subtotal), false],
        ["Tax", formatCurrency(invoice.tax), false],
        ["Total", formatCurrency(invoice.total), true],
        ["Amount Paid", formatCurrency(invoice.amountPaid), false],
        ["Balance Due", formatCurrency(invoice.balance), true],
      ];
      totals.forEach(([label, value, bold]) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(bold ? 11 : 9.5);
        doc.setTextColor(...(bold ? [20, 20, 20] : MUTED));
        doc.text(label, labelX, totalsY);
        doc.setTextColor(20, 20, 20);
        doc.text(value, valueX, totalsY, { align: "right" });
        totalsY += bold ? 20 : 16;
      });

      /* Footer */
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `Payment due by ${formatDate(invoice.dueDate)}. Thank you for your business!`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 40,
        { align: "center" }
      );

      doc.save(`${invoice.number || "invoice"}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  return { downloadPdf, isGenerating };
}
