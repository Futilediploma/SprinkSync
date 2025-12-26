import jsPDF from 'jspdf';
import { Canvg } from 'canvg';
import React from 'react';
import { createRoot } from 'react-dom/client';
import PipeSketch from './PipeSketch';

// Utility to format feet/inches for PDF
function formatFeetInches(inches: number) {
  const feet = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return `${feet}' ${inch}\"`;
}

// Export multiple pieces (3 per page) with job info header
export async function exportMultiPiecePdf(project: any, pieces: any[]) {
  // Image render/crop settings
  const scale = 2; // 2x resolution for crisp images
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
          pipeType: pieces[i].pipeType,
          pipetag: pieces[i].pipeTag || '',
          diameter: pieces[i].diameter,
          fittingsEndPipeLabel1: pieces[i].fittingsEnd1 || 'roll grooved',
          fittingsEndPipeLabel2: pieces[i].fittingsEnd2 || 'threaded',
          outlets: pieces[i].outlets || [],
          showExportButton: false,
          hideSummaryText: true, // Hide summary text for PDF export
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
  const headerY = 40;
  const pieceStartY = 100;
    const pieceGapY = 220 + 160; // image height + extra spacing
  for (let i = 0; i < pieces.length; i += 3) {
    if (i > 0) pdf.addPage();
    // Header
    pdf.setFontSize(20);
    pdf.text(`${project.companyName} - ${project.name}`, 40, headerY);
    pdf.setFontSize(12);
    pdf.text(`${project.streetNumber} ${project.streetName}, ${project.city}, ${project.zipcode}`, 40, headerY + 20);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 160, headerY + 20);
    // Pieces (up to 3 per page)
    for (let j = 0; j < 3 && i + j < pieces.length; ++j) {
      const piece = pieces[i + j];
      const y = pieceStartY + j * pieceGapY;
      // Restore summary text above the image
      pdf.setFontSize(15);
      pdf.text(`Pipe ID: ${piece.pipeTag || ''}`, 40, y);
      pdf.text(`Pipe Type: ${piece.pipeType || ''}`, 240, y);
      pdf.text(`Diameter: ${piece.diameter || ''} in`, 440, y);
  pdf.setFontSize(13);
  // Show length in feet/inches
  const totalInches = Number(piece.feet || 0) * 12 + (parseFloat(piece.inches) || 0);
  pdf.text(`Length: ${formatFeetInches(totalInches)}`, 40, y + 20);
// Utility to format feet/inches for PDF
function formatFeetInches(inches: number) {
  const feet = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return `${feet}' ${inch}"`;
}

      // Add the pipe sketch image, smaller and centered
      const imageY = y + 60;
      let imgHeight = 30;
      if (piece.image) {
        try {
          const maxWidth = 340; // smaller width
          const srcWidth = piece.imageWidth || (svgWidth * scale);
          const srcHeight = piece.imageHeight || (cropHeight * scale);
          let imgWidth = maxWidth;
          imgHeight = Math.round(imgWidth * (srcHeight / srcWidth));
          // If image is too tall, scale down to fit maxHeight
          const maxHeight = 160;
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = Math.round(imgHeight * (srcWidth / srcHeight));
          }
          const xPos = Math.round((pageWidth - imgWidth) / 2);
          pdf.addImage(piece.image, 'PNG', xPos, imageY, imgWidth, imgHeight);
          console.log(`Added cropped image to PDF for piece ${i + j}`);
        } catch (e) {
          console.error(`Error adding image to PDF for piece ${i + j}:`, e);
        }
      } else {
        console.warn(`No image available for piece ${i + j}`);
      }

      // Welded Outlets section below image, centered
      const outletsY = imageY + imgHeight + 20;
      if (piece.outlets && piece.outlets.length > 0) {
        pdf.setFontSize(12);
        pdf.text('Welded Outlets:', pageWidth / 2, outletsY, { align: 'center' });
        piece.outlets.forEach((o: any, k: number) => {
          pdf.text(
            `Location: ${o.location}   Size: ${o.size}   Type: ${o.type}   Direction: ${o.direction}`,
            pageWidth / 2,
            outletsY + 20 + k * 16,
            { align: 'center' }
          );
        });
      }
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
  // Use canvg to rasterize the SVG to PNG
  const canvas = document.createElement('canvas');
  canvas.width = svgElement.clientWidth || 480;
  canvas.height = svgElement.clientHeight || 120;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const v = await Canvg.from(ctx, svgElement.outerHTML);
    await v.render();
  }
  const imgData = canvas.toDataURL('image/png');

  // Create PDF
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Add title/info
  pdf.setFontSize(18);
  pdf.text('FieldFab Pipe Sketch Report', 40, 40);
  pdf.setFontSize(12);
  pdf.text(`Pipe ID: ${pipeData.pipetag || ''}`, 40, 65);
  pdf.text(`Pipe Type: ${pipeData.pipeType || ''}`, 40, 85);
  pdf.text(`Diameter: ${pipeData.diameter || ''} in`, 40, 105);
  // Show length in feet/inches
  const totalInches = Number(pipeData.length || 0);
  pdf.text(`Length: ${formatFeetInches(totalInches)}`, 40, 125);

  // Add PNG image
  pdf.addImage(imgData, 'PNG', 40, 140, 400, 120);
  // Add pipe end labels below the image, left and right
  pdf.setFontSize(13);
  pdf.text(pipeData.fittingsEndPipeLabel1 || 'roll grooved', 40, 270);
  pdf.text(pipeData.fittingsEndPipeLabel2 || 'threaded', 440, 270, { align: 'right' });

  // Add outlets table (if any)
  if (pipeData.outlets && pipeData.outlets.length > 0) {
    pdf.setFontSize(13);
    pdf.text('Welded Outlets:', 40, 280);
    pdf.setFontSize(11);
    const y = 300;
    pipeData.outlets.forEach((o: any, i: number) => {
      pdf.text(
        `Location: ${o.location}   Size: ${o.size}   Type: ${o.type}   Direction: ${o.direction}`,
        50,
        y + i * 18
      );
    });
  }

  // Add disclaimer footer
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    'IMPORTANT: Have a licensed fire protection engineer review all specs before fabrication/installation.',
    pdf.internal.pageSize.getWidth() / 2,
    pageHeight - 16,
    { align: 'center', maxWidth: pdf.internal.pageSize.getWidth() - 80 }
  );
  pdf.text(
    'Verify specifications and code compliance with manufacturers. Provided as-is for planning purposes.',
    pdf.internal.pageSize.getWidth() / 2,
    pageHeight - 10,
    { align: 'center', maxWidth: pdf.internal.pageSize.getWidth() - 80 }
  );

  // Save/download
  pdf.save('pipe-sketch-report.pdf');
}
