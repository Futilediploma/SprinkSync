import jsPDF from 'jspdf'

interface ChangeOrderPDFData {
  changeOrderNumber: string
  description: string
  submittedTo: string
  dateQuoted: string
  dateApproved?: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'in-review'
  notes?: string
  attachments?: string[]
  projectName?: string
  contractorName?: string
}

export const generateChangeOrderPDF = (data: ChangeOrderPDFData) => {
  const pdf = new jsPDF()
  
  // Set up the document
  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Colors
  const primaryColor = '#1e40af' // blue-700
  const grayColor = '#6b7280'   // gray-500
  const darkColor = '#111827'   // gray-900
  
  // Header
  pdf.setFillColor(primaryColor)
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  // Company Logo/Title
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('SprinkSync', margin, 25)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Construction Management Platform', margin, 32)
  
  // Document Title
  pdf.setTextColor(darkColor)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CHANGE ORDER', margin, 60)
  
  // Change Order Number
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Change Order #: ${data.changeOrderNumber}`, pageWidth - margin - 60, 60)
  
  // Horizontal line
  pdf.setDrawColor(grayColor)
  pdf.line(margin, 70, pageWidth - margin, 70)
  
  let yPos = 85
  
  // Project Information Section
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('PROJECT INFORMATION', margin, yPos)
  yPos += 15
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(darkColor)
  
  // Two column layout for project info
  const col1X = margin
  const col2X = pageWidth / 2 + 10
  
  pdf.text('Project:', col1X, yPos)
  pdf.text(data.projectName || 'N/A', col1X + 30, yPos)
  
  pdf.text('Contractor:', col2X, yPos)
  pdf.text(data.contractorName || 'N/A', col2X + 35, yPos)
  yPos += 15
  
  pdf.text('Submitted To:', col1X, yPos)
  pdf.text(data.submittedTo, col1X + 35, yPos)
  
  pdf.text('Status:', col2X, yPos)
  pdf.text(data.status.toUpperCase(), col2X + 25, yPos)
  yPos += 25
  
  // Change Order Details Section
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('CHANGE ORDER DETAILS', margin, yPos)
  yPos += 15
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(darkColor)
  
  // Description
  pdf.text('Description:', margin, yPos)
  yPos += 10
  
  // Split description into multiple lines if too long
  const descriptionLines = pdf.splitTextToSize(data.description, contentWidth - 20)
  pdf.text(descriptionLines, margin + 10, yPos)
  yPos += (descriptionLines.length * 5) + 15
  
  // Dates and Amount
  pdf.text('Date Quoted:', col1X, yPos)
  pdf.text(new Date(data.dateQuoted).toLocaleDateString(), col1X + 35, yPos)
  
  pdf.text('Amount:', col2X, yPos)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, col2X + 30, yPos)
  pdf.setFont('helvetica', 'normal')
  yPos += 15
  
  if (data.dateApproved) {
    pdf.text('Date Approved:', col1X, yPos)
    pdf.text(new Date(data.dateApproved).toLocaleDateString(), col1X + 40, yPos)
    yPos += 15
  }
  
  // Notes Section
  if (data.notes && data.notes.trim()) {
    yPos += 10
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(primaryColor)
    pdf.text('NOTES', margin, yPos)
    yPos += 15
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(darkColor)
    
    const notesLines = pdf.splitTextToSize(data.notes, contentWidth - 20)
    pdf.text(notesLines, margin + 10, yPos)
    yPos += (notesLines.length * 5) + 15
  }
  
  // Attachments Section
  if (data.attachments && data.attachments.length > 0) {
    yPos += 10
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(primaryColor)
    pdf.text('ATTACHMENTS', margin, yPos)
    yPos += 15
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(darkColor)
    
    data.attachments.forEach((attachment, index) => {
      pdf.text(`${index + 1}. ${attachment}`, margin + 10, yPos)
      yPos += 12
    })
    yPos += 5
  }
  
  // Approval Section
  yPos += 20
  if (yPos > pageHeight - 80) {
    pdf.addPage()
    yPos = 40
  }
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('APPROVAL SIGNATURES', margin, yPos)
  yPos += 20
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(darkColor)
  
  // Signature lines
  const signatureY = yPos + 20
  pdf.line(margin, signatureY, margin + 120, signatureY)
  pdf.text('Project Manager', margin, signatureY + 10)
  pdf.text('Date: _______________', margin, signatureY + 20)
  
  pdf.line(pageWidth - margin - 120, signatureY, pageWidth - margin, signatureY)
  pdf.text('Client Approval', pageWidth - margin - 120, signatureY + 10)
  pdf.text('Date: _______________', pageWidth - margin - 120, signatureY + 20)
  
  // Footer
  pdf.setFontSize(8)
  pdf.setTextColor(grayColor)
  const footerY = pageHeight - 15
  pdf.text('Generated by SprinkSync Construction Management Platform', margin, footerY)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - margin - 80, footerY)
  
  // Save the PDF
  const fileName = `Change_Order_${data.changeOrderNumber}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
