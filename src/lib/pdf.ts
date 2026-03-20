import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfTableOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  footerRow?: (string | number)[];
}

export function downloadTablePdf({
  title,
  subtitle,
  headers,
  rows,
  filename,
  footerRow,
}: PdfTableOptions) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 28);
    doc.setTextColor(0);
  }

  const startY = subtitle ? 34 : 28;

  const allRows = footerRow ? [...rows, footerRow] : rows;

  autoTable(doc, {
    startY,
    head: [headers],
    body: allRows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    ...(footerRow
      ? {
          didParseCell: (data: any) => {
            if (data.section === "body" && data.row.index === rows.length) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fillColor = [235, 235, 235];
            }
          },
        }
      : {}),
  });

  doc.save(filename);
}
