"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/utils/format";

/**
 * Lazy-loads jspdf + jspdf-autotable and downloads a styled PDF of a quote.
 * `company` is the issuing (tenant) company for the letterhead.
 *   const { downloadPdf, downloading } = useQuotePdf();
 *   downloadPdf(quote, company);
 */
export function useQuotePdf() {
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf(quote, company = {}) {
    if (!quote || downloading) return;
    setDownloading(true);
    const seller = {
      name: company.name || "—",
      website: company.website || "",
      address: [company.addressLine, company.city, company.country].filter(Boolean).join(", "),
      contact: [company.email, company.phone].filter(Boolean).join("  ·  "),
      taxId: company.taxId || "",
    };
    const cust = quote.customer ?? {};
    const custLines = [
      cust.company,
      cust.addressLine,
      [cust.city, cust.state, cust.postalCode].filter(Boolean).join(", "),
      cust.country,
      [cust.email, cust.phone].filter(Boolean).join(" · "),
    ].filter(Boolean);
    // Blank amounts print as a zero rather than an em-dash on a PDF.
    const money = (amount) => formatCurrency(Number(amount || 0), quote.currency);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const primary = [79, 70, 229];

      /* Header band */
      doc.setFillColor(...primary);
      doc.rect(0, 0, pageWidth, 90, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(seller.name, margin, 38);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (seller.address) doc.text(seller.address, margin, 54);
      if (seller.contact) doc.text(seller.contact, margin, 66);
      if (seller.taxId) doc.text(`Tax ID: ${seller.taxId}`, margin, 78);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("QUOTATION", pageWidth - margin, 44, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(quote.number || "", pageWidth - margin, 62, { align: "right" });

      /* Meta + customer */
      doc.setTextColor(30, 30, 30);
      let y = 120;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("QUOTE FOR", margin, y);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(quote.customerName || "—", margin, y + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      custLines.forEach((line, i) => doc.text(String(line), margin, y + 32 + i * 12));

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Issued: ${formatDate(quote.createdAt)}`, pageWidth - margin, y, { align: "right" });
      doc.text(`Valid until: ${formatDate(quote.validUntil)}`, pageWidth - margin, y + 14, { align: "right" });
      doc.text(`Status: ${String(quote.status || "draft").toUpperCase()}`, pageWidth - margin, y + 28, { align: "right" });

      /* Line items */
      const items = quote.items ?? [];
      autoTable(doc, {
        startY: Math.max(y + 44, y + 34 + custLines.length * 12),
        margin: { left: margin, right: margin },
        head: [["#", "Item", "Qty", "Unit price", "Amount"]],
        body: items.map((item, i) => [
          String(i + 1),
          item.productName || item.productId || "",
          `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`,
          money(item.unitPrice),
          money(item.total ?? item.quantity * item.unitPrice),
        ]),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: primary, fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 28 },
          2: { halign: "right", cellWidth: 50 },
          3: { halign: "right", cellWidth: 90 },
          4: { halign: "right", cellWidth: 90 },
        },
        alternateRowStyles: { fillColor: [246, 246, 250] },
      });

      /* Totals */
      let ty = (doc.lastAutoTable?.finalY ?? y + 60) + 18;
      const labelX = pageWidth - margin - 180;
      const valueX = pageWidth - margin;
      const totalsRow = (label, value, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(bold ? 12 : 10);
        doc.setTextColor(bold ? 30 : 100, bold ? 30 : 100, bold ? 30 : 100);
        doc.text(label, labelX, ty);
        doc.setTextColor(30, 30, 30);
        doc.text(value, valueX, ty, { align: "right" });
        ty += bold ? 20 : 16;
      };
      totalsRow("Subtotal", money(quote.subtotal));
      totalsRow("Discount", quote.discount ? `- ${money(quote.discount)}` : money(0));
      totalsRow("Tax", money(quote.tax));
      doc.setDrawColor(...primary);
      doc.line(labelX, ty - 8, valueX, ty - 8);
      ty += 6;
      totalsRow("Total", money(quote.total), true);

      /* Notes + footer */
      if (quote.notes) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Notes:", margin, ty + 8);
        doc.text(doc.splitTextToSize(String(quote.notes), pageWidth - margin * 2), margin, ty + 22);
      }
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        [seller.name, seller.website].filter(Boolean).join(" · "),
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 24,
        { align: "center" }
      );

      doc.save(`${quote.number || "quote"}.pdf`);
      toast.success("Quote PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  return { downloadPdf, downloading };
}
