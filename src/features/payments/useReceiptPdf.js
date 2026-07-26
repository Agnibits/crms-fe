"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";
import { PAYMENT_METHODS, findOption } from "@/constants/options";

const BRAND = [5, 150, 105]; // emerald-600 — matches the on-screen receipt
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];

/** Build the seller letterhead lines from the tenant company (no hardcoding). */
function sellerLines(company) {
  if (!company) return [];
  const addr = [company.addressLine, company.city, company.country]
    .filter(Boolean)
    .join(", ");
  const contact = [company.email, company.phone].filter(Boolean).join("  ·  ");
  return [addr, contact].filter(Boolean);
}

/**
 * Lazy-loads jspdf and generates a downloadable payment-receipt PDF using the
 * signed-in company as the letterhead.
 *
 *   const { downloadPdf, isGenerating } = useReceiptPdf();
 *   downloadPdf(payment, company);
 */
export function useReceiptPdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  async function downloadPdf(payment, company) {
    if (!payment) return;
    setIsGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;

      /* Brand header band */
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, pageWidth, 90, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(company?.name || "AgniBits CRM", margin, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      sellerLines(company).forEach((line, i) => doc.text(line, margin, 56 + i * 12));

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("PAYMENT RECEIPT", pageWidth - margin, 42, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(String(payment.number ?? ""), pageWidth - margin, 60, { align: "right" });

      /* Amount hero */
      let y = 140;
      doc.setTextColor(...MUTED);
      doc.setFontSize(10);
      doc.text("Payment received", pageWidth / 2, y, { align: "center" });
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text(formatCurrency(payment.amount), pageWidth / 2, y + 30, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(formatDateTime(payment.paidAt), pageWidth / 2, y + 48, { align: "center" });

      /* Divider */
      y += 74;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);

      /* Detail rows */
      const methodLabel =
        findOption(PAYMENT_METHODS, payment.method)?.label ?? payment.method ?? "—";
      const rows = [
        ["Receipt #", payment.number || "—"],
        ["Customer", payment.customerName || "—"],
        ["Invoice", payment.invoiceNumber || "—"],
        ["Method", methodLabel],
        ["Reference", payment.reference || "—"],
        ["Payment Date", formatDate(payment.paidAt)],
        ["Status", "Completed"],
      ];
      y += 26;
      rows.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...INK);
        doc.text(String(value), pageWidth - margin, y, { align: "right" });
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + 8, pageWidth - margin, y + 8);
        y += 26;
      });

      /* Footer */
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(
        "This receipt was generated automatically and is valid without signature.",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 40,
        { align: "center" }
      );

      doc.save(`${payment.number || "receipt"}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate receipt PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  return { downloadPdf, isGenerating };
}
