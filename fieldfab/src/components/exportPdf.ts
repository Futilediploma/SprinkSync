/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import { Canvg } from 'canvg';
import React from 'react';
import { createRoot } from 'react-dom/client';
import PipeSketch from './PipeSketch';

// Utility to format lengths in fabrication style for PDF.
function formatFabDimension(inches: number) {
  if (!Number.isFinite(inches)) return `0-0`;

  const feet = Math.floor(inches / 12);
  const remainder = inches - feet * 12;
  const roundedEighths = Math.round(remainder * 8);
  const wholeInches = Math.floor(roundedEighths / 8);
  const fracNumerator = roundedEighths % 8;

  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  let inchPart = `${wholeInches}`;

  if (fracNumerator !== 0) {
    const divisor = gcd(fracNumerator, 8);
    const num = fracNumerator / divisor;
    const den = 8 / divisor;
    inchPart = wholeInches > 0 ? `${wholeInches} ${num}/${den}` : `${num}/${den}`;
  }

  return `${feet}-${inchPart}`;
}

function formatFabLength(inches: number) {
  return `${formatFabDimension(inches)}\"`;
}

// Export multiple pieces (3 per page) with job info header
export async function exportMultiPiecePdf(project: any, pieces: any[]) {
  // Image render/crop settings
  const scale = 4; // 4x resolution for sharper printed/exported sketches
  const svgWidth = 480; // Original SVG width
  const svgHeight = 275; // Original SVG height
  const cropY = 0; // Capture from the very top
  const cropHeight = svgHeight; // Capture the full SVG height
  // Generate images for all pieces (force regeneration)
  for (let i = 0; i < pieces.length; ++i) {
    // Always generate image for PDF export
    {
      // Create an offscreen container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '480px';
      container.style.background = '#fff';
      document.body.appendChild(container);
      // Render PipeSketch using React 18+ createRoot
      const root = createRoot(container);
      root.render(
        React.createElement(PipeSketch, {
          length: Number(pieces[i].feet) * 12 + (parseFloat(pieces[i].inches) || 0),
          qty: pieces[i].qty,
          pipeType: pieces[i].pipeType,
          pipetag: pieces[i].pipeTag || '',
          diameter: pieces[i].diameter,
          fittingsEndPipeLabel1: pieces[i].fittingsEnd1 || 'roll grooved',
          fittingsEndPipeLabel2: pieces[i].fittingsEnd2 || 'threaded',
          outlets: pieces[i].outlets || [],
          showExportButton: false,
          hideSummaryText: false,
        })
      );
  // Wait for render (increase to 300ms for reliability)
  await new Promise(r => setTimeout(r, 300));
      const svgElem = container.querySelector('svg');
      if (svgElem) {
        try {
          // Render full SVG to a temp canvas
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = svgWidth * scale;
          tempCanvas.height = svgHeight * scale;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            const v = await Canvg.from(tempCtx, svgElem.outerHTML, { ignoreDimensions: true });
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.save();
            tempCtx.scale(scale, scale); // Scale uniformly
            await v.render();
            tempCtx.restore();
            // Now crop the selected region to a new canvas
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = svgWidth * scale;
            cropCanvas.height = cropHeight * scale;
            const cropCtx = cropCanvas.getContext('2d');
            if (cropCtx) {
              cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
              cropCtx.drawImage(
                tempCanvas,
                0, cropY * scale, svgWidth * scale, cropHeight * scale, // source rect
                0, 0, svgWidth * scale, cropHeight * scale // dest rect
              );
              pieces[i].image = cropCanvas.toDataURL('image/png');
              pieces[i].imageWidth = cropCanvas.width;
              pieces[i].imageHeight = cropCanvas.height;
              console.log(`Generated full image for piece ${i}:`, pieces[i].image ? 'Success' : 'Failed');
            }
          }
        } catch (error) {
          console.error(`Error generating image for piece ${i}:`, error);
        }
      }
      root.unmount();
      document.body.removeChild(container);
    }
  }
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const headerY = 34;
  const pieceStartY = 76;
  const pageBottomReserve = 34;
  const piecesPerPage = 3;
  const slotGap = 8;
  const slotHeight = (pageHeight - pieceStartY - pageBottomReserve) / piecesPerPage;

  const getRenderedImageSize = (piece: any, maxHeight: number) => {
    const maxWidth = pageWidth - 92;
    const srcWidth = piece.imageWidth || (svgWidth * scale);
    const srcHeight = piece.imageHeight || (cropHeight * scale);

    let imgWidth = maxWidth;
    let imgHeight = Math.round(imgWidth * (srcHeight / srcWidth));

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = Math.round(imgHeight * (srcWidth / srcHeight));
    }

    return { imgWidth, imgHeight };
  };

  const drawHeader = () => {
    pdf.setTextColor(20, 28, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(`${project.companyName} - ${project.name}`, 40, headerY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`${project.streetNumber} ${project.streetName}, ${project.city}, ${project.zipcode}`, 40, headerY + 20);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 160, headerY + 20);
  };

  drawHeader();

  for (let index = 0; index < pieces.length; index++) {
    const piece = pieces[index];

    if (index > 0 && index % piecesPerPage === 0) {
      pdf.addPage();
      drawHeader();
    }

    const slotIndex = index % piecesPerPage;
    const slotTop = pieceStartY + slotIndex * slotHeight;
    const slotBottom = slotTop + slotHeight - slotGap - 8;
    let y = slotTop;
    const totalInches = Number(piece.feet || 0) * 12 + (parseFloat(piece.inches) || 0);
    const outletCount = Array.isArray(piece.outlets) ? piece.outlets.length : 0;

    pdf.setTextColor(20, 28, 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Pipe ID: ${piece.pipeTag || ''}`, 40, y);
    pdf.text(`Qty: ${piece.qty ?? 1}`, 210, y);
    y += 12;

    pdf.text(`Pipe Type: ${piece.pipeType || ''}`, 40, y, { maxWidth: 260 });
    pdf.text(`Diameter: ${piece.diameter || ''} in`, 330, y);
    y += 12;

    pdf.text(`Length: ${formatFabLength(totalInches)}`, 40, y);
    y += 6;

    const outletsBlockHeight = outletCount > 0 ? 20 + Math.min(outletCount, 3) * 10 : 0;
    const imageY = y;
    const imageMaxHeight = Math.max(118, slotBottom - imageY - outletsBlockHeight - 8);
    const { imgWidth, imgHeight } = getRenderedImageSize(piece, imageMaxHeight);

    if (piece.image) {
      try {
        const xPos = Math.round((pageWidth - imgWidth) / 2);
        pdf.addImage(piece.image, 'PNG', xPos, imageY, imgWidth, imgHeight, undefined, 'NONE');
        console.log(`Added cropped image to PDF for piece ${index}`);
      } catch (e) {
        console.error(`Error adding image to PDF for piece ${index}:`, e);
      }
    } else {
      console.warn(`No image available for piece ${index}`);
    }

    let renderedBottom = imageY + imgHeight;

    if (piece.outlets && piece.outlets.length > 0) {
      const outletsY = renderedBottom + 9;
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Welded Outlets:', pageWidth / 2, outletsY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      piece.outlets.slice(0, 3).forEach((o: any, k: number) => {
        const location = Number(o.location);
        const locationText = Number.isFinite(location) ? formatFabDimension(location) : String(o.location ?? '');
        pdf.text(
          `Location: ${locationText}   Size: ${o.size}   Type: ${o.type}   Direction: ${o.direction}`,
          pageWidth / 2,
          outletsY + 10 + k * 9,
          { align: 'center' }
        );
      });
      if (piece.outlets.length > 3) {
        pdf.text(`+ ${piece.outlets.length - 3} more outlets`, pageWidth / 2, outletsY + 10 + 3 * 9, { align: 'center' });
      }
      renderedBottom = outletsY + 10 + Math.min(piece.outlets.length, 3) * 9;
    }

    const separatorY = pieceStartY + (slotIndex + 1) * slotHeight - slotGap / 2;
    if (slotIndex < piecesPerPage - 1 && index < pieces.length - 1) {
      pdf.setDrawColor(210, 214, 220);
      pdf.setLineWidth(0.6);
      pdf.line(40, separatorY, pageWidth - 40, separatorY);
    }
  }

  // Add disclaimer footer to all pages
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Disclaimer text
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      'IMPORTANT: Have a licensed fire protection engineer review all specs before fabrication/installation.',
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center', maxWidth: pageWidth - 40 }
    );
    pdf.text(
      'Verify specifications and code compliance with manufacturers. Provided as-is for planning purposes.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center', maxWidth: pageWidth - 40 }
    );
  }

  pdf.save(`${project.name || 'project'}-pipe-report.pdf`);
}

/**
 * Export the given SVG and pipe data as a PDF file.
 * @param svgElement The SVG DOM node to export (pipe sketch)
 * @param pipeData   An object with pipe info, outlets, etc.
 */
export async function exportPipeSketchPdf(svgElement: SVGSVGElement, pipeData: any) {
  const viewBox = svgElement.getAttribute('viewBox');
  const vb = viewBox ? viewBox.split(/\s+/).map(Number) : [];
  const sourceWidth = vb.length === 4 && Number.isFinite(vb[2]) ? vb[2] : (svgElement.clientWidth || 480);
  const sourceHeight = vb.length === 4 && Number.isFinite(vb[3]) ? vb[3] : (svgElement.clientHeight || 275);
  const scale = 4;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.scale(scale, scale);
    const v = await Canvg.from(ctx, svgElement.outerHTML, { ignoreDimensions: true });
    await v.render();
  }
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  pdf.setFontSize(18);
  pdf.text('FieldFab Pipe Sketch Report', margin, y);
  y += 26;

  pdf.setFontSize(12);
  pdf.text(`Pipe ID: ${pipeData.pipetag || ''}`, margin, y);
  pdf.text(`Qty: ${pipeData.qty ?? 1}`, margin + 180, y);
  y += 18;

  pdf.text(`Pipe Type: ${pipeData.pipeType || ''}`, margin, y, { maxWidth: 260 });
  pdf.text(`Diameter: ${pipeData.diameter || ''} in`, margin + 300, y);
  y += 18;

  const totalInches = Number(pipeData.length || 0);
  pdf.text(`Length: ${formatFabLength(totalInches)}`, margin, y);
  y += 18;

  const imageMaxWidth = contentWidth;
  const imageMaxHeight = 340;
  let imageWidth = imageMaxWidth;
  let imageHeight = imageWidth * (sourceHeight / sourceWidth);
  if (imageHeight > imageMaxHeight) {
    imageHeight = imageMaxHeight;
    imageWidth = imageHeight * (sourceWidth / sourceHeight);
  }

  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = y + 8;
  pdf.addImage(imgData, 'PNG', imageX, imageY, imageWidth, imageHeight, undefined, 'NONE');
  y = imageY + imageHeight + 20;

  pdf.setFontSize(12);
  pdf.text(`End 1: ${pipeData.fittingsEndPipeLabel1 || 'roll grooved'}`, margin, y);
  pdf.text(`End 2: ${pipeData.fittingsEndPipeLabel2 || 'threaded'}`, pageWidth - margin, y, { align: 'right' });
  y += 22;

  if (pipeData.outlets && pipeData.outlets.length > 0) {
    pdf.setFontSize(13);
    pdf.text('Welded Outlets', margin, y);
    y += 16;

    pdf.setFontSize(11);
    for (const outlet of pipeData.outlets) {
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = 40;
        pdf.setFontSize(13);
        pdf.text('Welded Outlets (cont.)', margin, y);
        y += 16;
        pdf.setFontSize(11);
      }

      const location = Number(outlet.location);
      const locationText = Number.isFinite(location) ? formatFabDimension(location) : String(outlet.location ?? '');
      pdf.text(`Location: ${locationText}   Size: ${outlet.size ?? ''}`, margin + 8, y);
      y += 13;
      pdf.text(`Type: ${outlet.type ?? ''}   Direction: ${outlet.direction ?? ''}`, margin + 8, y, {
        maxWidth: contentWidth - 16,
      });
      y += 14;
    }
  }

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    'IMPORTANT: Have a licensed fire protection engineer review all specs before fabrication/installation.',
    pageWidth / 2,
    pageHeight - 16,
    { align: 'center', maxWidth: pageWidth - 80 }
  );
  pdf.text(
    'Verify specifications and code compliance with manufacturers. Provided as-is for planning purposes.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center', maxWidth: pageWidth - 80 }
  );

  pdf.save('pipe-sketch-report.pdf');
}
