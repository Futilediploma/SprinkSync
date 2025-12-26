import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MaterialItem } from '../components/LooseMaterialForm';
import type { Project } from '../types';

/**
 * Export loose materials to professional CSV format
 */
export function exportToCSV(materials: MaterialItem[], project: Project | null): void {
  if (materials.length === 0) {
    alert('No materials to export');
    return;
  }

  // Create header rows
  const headers = [
    ['LOOSE MATERIAL LIST'],
    [''],
    [`Project: ${project?.name || 'Untitled Project'}`],
    [`Company: ${project?.companyName || 'N/A'}`],
    [`Date: ${new Date().toLocaleDateString()}`],
    [''],
    ['#', 'Qty', 'Size', 'Product Name', 'Description', 'Type', 'Options']
  ];

// Create data rows
const rows = materials.map((material, idx) => [
  (idx + 1).toString(),
  material.qty.toString(),
  material.sizes && material.sizes.length > 0 ? material.sizes.join(', ') : (material.size || '-'),
  material.part,
  material.description,
  material.type,
  material.options && material.options.length > 0 ? material.options.join(', ') : ''
]);

// Create disclaimer rows
const disclaimerRows = [
  [''],
  [''],
  ['IMPORTANT NOTES:'],
  ['Please have a licensed fire protection engineer review all specifications before fabrication or installation.'],
  ['Verify product specs, sizes, quantities, and code compliance (NFPA, local AHJ) with manufacturers before ordering.'],
  ['This tool is provided as-is to help with planning. User assumes all responsibility for verifying information.']
];

// Combine headers, rows, and disclaimer
const csvContent = [...headers, ...rows, ...disclaimerRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${project?.name || 'loose_materials'}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export loose materials to professional Excel format with styling
 */
export function exportToExcel(materials: MaterialItem[], project: Project | null): void {
  if (materials.length === 0) {
    alert('No materials to export');
    return;
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet data
  const wsData: any[][] = [
    ['LOOSE MATERIAL LIST'],
    [],
    [`Project: ${project?.name || 'Untitled Project'}`],
    [`Company: ${project?.companyName || 'N/A'}`],
    [`Date: ${new Date().toLocaleDateString()}`],
    [],
    ['#', 'Qty', 'Size', 'Product Name', 'Description', 'Type', 'Options'],
    ...materials.map((material, idx) => [
      idx + 1,
      material.qty,
      material.sizes && material.sizes.length > 0 ? material.sizes.join(', ') : (material.size || '-'),
      material.part,
      material.description,
      material.type,
      material.options && material.options.length > 0 ? material.options.join(', ') : ''
    ]),
    [],
    [],
    ['IMPORTANT NOTES:'],
    ['Please have a licensed fire protection engineer review all specifications before fabrication or installation.'],
    ['Verify product specs, sizes, quantities, and code compliance (NFPA, local AHJ) with manufacturers before ordering.'],
    ['This tool is provided as-is to help with planning. User assumes all responsibility for verifying information.'],
    ['Please have a licensed fire protection engineer or Qualified NICET to review all specifications before fabrication or installation.'],
    ['Verify product specs, sizes, quantities, and code compliance (NFPA, local AHJ) with manufacturers before ordering.'],
    ['This tool is provided as-is to help with planning. User assumes all responsibility for verifying information.']
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 6 },   // Qty
    { wch: 12 },  // Size
    { wch: 35 },  // Product Name
    { wch: 50 },  // Description
    { wch: 18 },  // Type
    { wch: 25 }   // Options
  ];

  // Merge cells for title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title row
  ];

  // Style the title row (A1)
  if (!ws['A1'].s) ws['A1'].s = {};
  ws['A1'].s = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  // Style header row (row 7)
  ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'].forEach(cell => {
    if (!ws[cell]) ws[cell] = { t: 's', v: '' };
    if (!ws[cell].s) ws[cell].s = {};
    ws[cell].s = {
      font: { bold: true, sz: 11 },
      fill: { fgColor: { rgb: 'E7E6E6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Materials');

  // Save file
  XLSX.writeFile(wb, `${project?.name || 'loose_materials'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export loose materials to professional PDF format
 */
export function exportToPDF(materials: MaterialItem[], project: Project | null): void {
  if (materials.length === 0) {
    alert('No materials to export');
    return;
  }

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter'
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LOOSE MATERIAL LIST', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  // Add project info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${project?.name || 'Untitled Project'}`, 14, 32);
  doc.text(`Company: ${project?.companyName || 'N/A'}`, 14, 38);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);

  // Prepare table data
  const tableData = materials.map((material, idx) => [
    (idx + 1).toString(),
    material.qty.toString(),
    material.sizes && material.sizes.length > 0 ? material.sizes.join(', ') : (material.size || '-'),
    material.part,
    material.description,
    material.type,
    material.options && material.options.length > 0 ? material.options.join(', ') : ''
  ]);

  // Add table
  autoTable(doc, {
    head: [['#', 'Qty', 'Size', 'Product Name', 'Description', 'Type', 'Options']],
    body: tableData,
    startY: 52,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [66, 139, 202], // Professional blue
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },  // #
      1: { cellWidth: 12, halign: 'center' },  // Qty
      2: { cellWidth: 20, halign: 'left' },    // Size
      3: { cellWidth: 55, halign: 'left' },    // Product Name
      4: { cellWidth: 80, halign: 'left' },    // Description
      5: { cellWidth: 28, halign: 'left' },    // Type
      6: { cellWidth: 35, halign: 'left' }     // Options
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] // Light gray for alternating rows
    },
    margin: { left: 14, right: 14 }
  });

  // Add footer with page numbers and disclaimer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Disclaimer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'IMPORTANT: Have a licensed fire protection engineer review all specs before fabrication/installation.',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 16,
      { align: 'center', maxWidth: doc.internal.pageSize.getWidth() - 28 }
    );
    doc.text(
      'Verify product specifications and code compliance with manufacturers. Provided as-is for planning purposes.',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 13,
      { align: 'center', maxWidth: doc.internal.pageSize.getWidth() - 28 }
    );

    // Page number
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`${project?.name || 'loose_materials'}_${new Date().toISOString().split('T')[0]}.pdf`);
}
