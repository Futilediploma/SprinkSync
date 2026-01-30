/**
 * Export Schedule to Various Formats
 * Creates professional-looking output documents from parsed fire protection activities
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FireProtectionActivity } from '../types'

export interface ExportOptions {
  projectName?: string
  contractorName?: string
  projectNumber?: string
  reportDate?: string
  includeAIReasoning?: boolean
  groupByPhase?: boolean
  sortBy?: 'phase' | 'date' | 'activity'
}

/**
 * Export to CSV format
 */
export function exportToCSV(activities: FireProtectionActivity[], options: ExportOptions = {}): void {
  const headers = [
    'Activity ID',
    'Activity Name',
    'Original Name',
    'Phase',
    'Start Date',
    'Finish Date',
    'Duration (Days)',
    'Confidence',
    ...(options.includeAIReasoning ? ['AI Confidence', 'AI Reasoning'] : []),
    'Keywords'
  ]

  const rows = activities.map(activity => [
    activity.activityId || '',
    activity.llm_suggestion || activity.name,
    activity.llm_suggestion ? activity.name : '', // Show original only if we have a cleaned version
    activity.llm_phase || activity.phase,
    activity.startDate || '',
    activity.finishDate || '',
    activity.duration?.toString() || '',
    activity.confidence,
    ...(options.includeAIReasoning ? [
      activity.llm_confidence ? `${Math.round(activity.llm_confidence * 100)}%` : '',
      activity.llm_reasoning?.replace(/"/g, '""') || ''
    ] : []),
    activity.keywords.join('; ')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Download the CSV
  const projectName = options.projectName || 'FireProtectionSchedule'
  const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_FireProtection_${Date.now()}.csv`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export to PDF format with professional formatting
 */
export function exportToPDF(activities: FireProtectionActivity[], options: ExportOptions): void {
  const doc = new jsPDF('l', 'mm', 'letter') // Landscape, letter size
  
  const projectName = options.projectName || 'Fire Protection Schedule'
  const contractorName = options.contractorName || ''
  const projectNumber = options.projectNumber || ''
  const reportDate = options.reportDate || new Date().toLocaleDateString()

  // Calculate statistics
  const totalActivities = activities.length
  const highConfidence = activities.filter(a => a.confidence === 'high').length
  const aiVerified = activities.filter(a => a.llm_confidence && a.llm_confidence >= 0.7).length
  const testingCount = activities.filter(a => a.phase === 'Testing').length

  let yPosition = 20

  // Header - Project Title
  doc.setFontSize(20)
  doc.setTextColor(255, 107, 107) // #FF6B6B
  doc.text('🔥 ' + projectName, 15, yPosition)
  
  yPosition += 8
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('Fire Protection Activity Schedule', 15, yPosition)

  // Project Information Box
  yPosition += 10
  doc.setFillColor(249, 249, 249)
  doc.rect(15, yPosition, 250, 25, 'F')
  
  yPosition += 7
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  
  let xPos = 20
  if (contractorName) {
    doc.text('CONTRACTOR', xPos, yPosition)
    doc.setTextColor(50, 50, 50)
    doc.text(contractorName, xPos, yPosition + 5)
    xPos += 80
  }
  
  doc.setTextColor(100, 100, 100)
  if (projectNumber) {
    doc.text('PROJECT NUMBER', xPos, yPosition)
    doc.setTextColor(50, 50, 50)
    doc.text(projectNumber, xPos, yPosition + 5)
    xPos += 60
  }
  
  doc.setTextColor(100, 100, 100)
  doc.text('REPORT DATE', xPos, yPosition)
  doc.setTextColor(50, 50, 50)
  doc.text(reportDate, xPos, yPosition + 5)
  
  xPos += 50
  doc.setTextColor(100, 100, 100)
  doc.text('TOTAL ACTIVITIES', xPos, yPosition)
  doc.setTextColor(50, 50, 50)
  doc.text(totalActivities.toString(), xPos, yPosition + 5)

  // Statistics Boxes
  yPosition += 15
  const statBoxWidth = 55
  const statBoxHeight = 18
  let statX = 15

  // Stat 1: Total Activities
  doc.setFillColor(102, 126, 234) // Purple gradient color
  doc.roundedRect(statX, yPosition, statBoxWidth, statBoxHeight, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(totalActivities.toString(), statX + statBoxWidth/2, yPosition + 10, { align: 'center' })
  doc.setFontSize(9)
  doc.text('Total Activities', statX + statBoxWidth/2, yPosition + 15, { align: 'center' })

  // Stat 2: High Confidence
  statX += statBoxWidth + 5
  doc.setFillColor(102, 126, 234)
  doc.roundedRect(statX, yPosition, statBoxWidth, statBoxHeight, 3, 3, 'F')
  doc.setFontSize(18)
  doc.text(highConfidence.toString(), statX + statBoxWidth/2, yPosition + 10, { align: 'center' })
  doc.setFontSize(9)
  doc.text('High Confidence', statX + statBoxWidth/2, yPosition + 15, { align: 'center' })

  // Stat 3: AI Verified (if available)
  if (aiVerified > 0) {
    statX += statBoxWidth + 5
    doc.setFillColor(102, 126, 234)
    doc.roundedRect(statX, yPosition, statBoxWidth, statBoxHeight, 3, 3, 'F')
    doc.setFontSize(18)
    doc.text(aiVerified.toString(), statX + statBoxWidth/2, yPosition + 10, { align: 'center' })
    doc.setFontSize(9)
    doc.text('AI Verified', statX + statBoxWidth/2, yPosition + 15, { align: 'center' })
  }

  // Stat 4: Testing & Inspections
  statX += statBoxWidth + 5
  doc.setFillColor(102, 126, 234)
  doc.roundedRect(statX, yPosition, statBoxWidth, statBoxHeight, 3, 3, 'F')
  doc.setFontSize(18)
  doc.text(testingCount.toString(), statX + statBoxWidth/2, yPosition + 10, { align: 'center' })
  doc.setFontSize(9)
  doc.text('Testing & Inspections', statX + statBoxWidth/2, yPosition + 15, { align: 'center' })

  yPosition += statBoxHeight + 10

  // Group activities by phase if requested
  const grouped = options.groupByPhase ? groupActivitiesByPhase(activities) : { 'All Activities': activities }

  // Generate tables for each phase
  Object.entries(grouped).forEach(([phaseName, phaseActivities], index) => {
    // Add new page if needed (except for first group)
    if (index > 0 && yPosition > 160) {
      doc.addPage()
      yPosition = 20
    }

    // Phase header (if grouping by phase)
    if (options.groupByPhase) {
      doc.setFillColor(255, 107, 107)
      doc.roundedRect(15, yPosition, 250, 10, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.text(phaseName, 20, yPosition + 7)
      yPosition += 12
    }

    // Table headers
    const headers = [
      'ID',
      'Activity Name',
      ...(!options.groupByPhase ? ['Phase'] : []),
      'Start Date',
      'Finish Date',
      'Duration',
      'Confidence',
      ...(options.includeAIReasoning ? ['AI Score'] : [])
    ]

    // Table data
    const tableData = phaseActivities.map(activity => [
      activity.activityId || 'N/A',
      activity.llm_suggestion || activity.name,
      ...(!options.groupByPhase ? [activity.llm_phase || activity.phase] : []),
      activity.startDate || '-',
      activity.finishDate || '-',
      activity.duration ? `${activity.duration}d` : '-',
      activity.confidence.toUpperCase(),
      ...(options.includeAIReasoning && activity.llm_confidence 
        ? [`${Math.round(activity.llm_confidence * 100)}%`] 
        : options.includeAIReasoning ? ['-'] : [])
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [248, 248, 248],
        textColor: [85, 85, 85],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 20 }, // ID
        1: { cellWidth: options.groupByPhase ? 90 : 75 }, // Activity Name
        ...(!options.groupByPhase ? { 2: { cellWidth: 35 } } : {}), // Phase (if shown)
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      didParseCell: function(data) {
        // Color-code confidence badges
        const confIndex = options.includeAIReasoning ? (options.groupByPhase ? 6 : 7) : (options.groupByPhase ? 5 : 6)
        if (data.column.index === confIndex && data.section === 'body') {
          const confidence = data.cell.text[0]?.toLowerCase()
          if (confidence === 'high') {
            data.cell.styles.fillColor = [232, 245, 233] // Light green
            data.cell.styles.textColor = [46, 125, 50] // Dark green
          } else if (confidence === 'medium') {
            data.cell.styles.fillColor = [255, 243, 224] // Light orange
            data.cell.styles.textColor = [239, 108, 0] // Dark orange
          } else if (confidence === 'low') {
            data.cell.styles.fillColor = [255, 235, 238] // Light red
            data.cell.styles.textColor = [198, 40, 40] // Dark red
          }
        }
      }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 8
  })

  // Add AI Reasoning section if requested
  if (options.includeAIReasoning && activities.some(a => a.llm_reasoning)) {
    const reasoningActivities = activities.filter(a => a.llm_reasoning).slice(0, 5)
    
    if (yPosition > 160) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(245, 247, 255)
    doc.rect(15, yPosition, 250, 10, 'F')
    doc.setTextColor(102, 126, 234)
    doc.setFontSize(12)
    doc.text('🤖 AI Classification Reasoning', 20, yPosition + 7)
    yPosition += 12

    reasoningActivities.forEach(activity => {
      if (yPosition > 180) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(9)
      doc.setTextColor(50, 50, 50)
      doc.setFont('helvetica', 'bold')
      doc.text(activity.llm_suggestion || activity.name, 20, yPosition, { maxWidth: 240 })
      
      yPosition += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(85, 85, 85)
      doc.setFontSize(8)
      const reasoningLines = doc.splitTextToSize(activity.llm_reasoning || '', 240)
      doc.text(reasoningLines, 20, yPosition)
      
      yPosition += reasoningLines.length * 4 + 5
    })

    if (activities.filter(a => a.llm_reasoning).length > 5) {
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'italic')
      doc.text(
        `Showing first 5 of ${activities.filter(a => a.llm_reasoning).length} AI-analyzed activities`,
        20,
        yPosition
      )
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generated by SprinkSync Schedule Parser${options.includeAIReasoning ? ' with AI Enhancement' : ''}`,
      15,
      200
    )
    doc.text(`Report Date: ${reportDate}`, 200, 200)
    doc.text(`Page ${i} of ${pageCount}`, 250, 200)
  }

  // Download the PDF
  const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_FireProtection_${Date.now()}.pdf`
  doc.save(filename)
}

/**
 * Download PDF helper
 */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}

/**
 * Export to HTML format (printable document) - DEPRECATED, kept for reference
 */
function exportToHTML(activities: FireProtectionActivity[], options: ExportOptions): string {
  const projectName = options.projectName || 'Fire Protection Schedule'
  const contractorName = options.contractorName || ''
  const projectNumber = options.projectNumber || ''
  const reportDate = options.reportDate || new Date().toLocaleDateString()

  // Group by phase if requested
  const grouped = options.groupByPhase ? groupActivitiesByPhase(activities) : { 'All Activities': activities }

  // Calculate statistics
  const totalActivities = activities.length
  const highConfidence = activities.filter(a => a.confidence === 'high').length
  const aiVerified = activities.filter(a => a.llm_confidence && a.llm_confidence >= 0.7).length

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - Fire Protection Schedule</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    header {
      border-bottom: 3px solid #FF6B6B;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    h1 {
      color: #FF6B6B;
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .project-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-weight: 600;
      color: #666;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 1.1rem;
      color: #333;
      margin-top: 5px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .phase-section {
      margin-bottom: 40px;
    }

    .phase-header {
      background: #FF6B6B;
      color: white;
      padding: 15px 20px;
      border-radius: 8px 8px 0 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    thead {
      background: #f8f8f8;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #ddd;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tbody tr {
      border-bottom: 1px solid #eee;
    }

    tbody tr:hover {
      background: #f9f9f9;
    }

    td {
      padding: 12px;
      font-size: 0.95rem;
    }

    .activity-name {
      font-weight: 500;
      color: #333;
    }

    .confidence-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .confidence-high {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .confidence-medium {
      background: #fff3e0;
      color: #ef6c00;
    }

    .confidence-low {
      background: #ffebee;
      color: #c62828;
    }

    .ai-confidence {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .ai-high {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .ai-medium {
      background: #fff3e0;
      color: #ef6c00;
    }

    .ai-low {
      background: #ffebee;
      color: #c62828;
    }

    .keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .keyword {
      background: #ffe0e0;
      color: #FF6B6B;
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 0.75rem;
    }

    .reasoning-section {
      margin-top: 40px;
      padding: 20px;
      background: #f5f7ff;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .reasoning-section h3 {
      color: #667eea;
      margin-bottom: 15px;
    }

    .reasoning-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
    }

    .reasoning-item:last-child {
      border-bottom: none;
    }

    .reasoning-activity {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }

    .reasoning-text {
      color: #555;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #999;
      font-size: 0.85rem;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 20px;
      }

      .phase-section {
        page-break-inside: avoid;
      }

      tbody tr:hover {
        background: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔥 ${projectName}</h1>
      <p style="color: #666; margin-top: 5px;">Fire Protection Activity Schedule</p>
    </header>

    <div class="project-info">
      ${contractorName ? `
      <div class="info-item">
        <span class="info-label">Contractor</span>
        <span class="info-value">${contractorName}</span>
      </div>
      ` : ''}
      ${projectNumber ? `
      <div class="info-item">
        <span class="info-label">Project Number</span>
        <span class="info-value">${projectNumber}</span>
      </div>
      ` : ''}
      <div class="info-item">
        <span class="info-label">Report Date</span>
        <span class="info-value">${reportDate}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Total Activities</span>
        <span class="info-value">${totalActivities}</span>
      </div>
    </div>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-number">${totalActivities}</div>
        <div class="stat-label">Total Activities</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${highConfidence}</div>
        <div class="stat-label">High Confidence</div>
      </div>
      ${aiVerified > 0 ? `
      <div class="stat-box">
        <div class="stat-number">${aiVerified}</div>
        <div class="stat-label">AI Verified</div>
      </div>
      ` : ''}
      <div class="stat-box">
        <div class="stat-number">${activities.filter(a => a.phase === 'Testing').length}</div>
        <div class="stat-label">Testing & Inspections</div>
      </div>
    </div>

    ${Object.entries(grouped).map(([phaseName, phaseActivities]) => `
      <div class="phase-section">
        ${options.groupByPhase ? `<div class="phase-header">${phaseName}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">ID</th>
              <th style="width: 30%;">Activity</th>
              ${!options.groupByPhase ? '<th style="width: 15%;">Phase</th>' : ''}
              <th style="width: 12%;">Start Date</th>
              <th style="width: 12%;">Finish Date</th>
              <th style="width: 8%;">Duration</th>
              <th style="width: 10%;">Confidence</th>
              ${options.includeAIReasoning ? '<th style="width: 10%;">AI Score</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${phaseActivities.map(activity => `
              <tr>
                <td><code>${activity.activityId || 'N/A'}</code></td>
                <td class="activity-name">${activity.llm_suggestion || activity.name}</td>
                ${!options.groupByPhase ? `<td>${activity.llm_phase || activity.phase}</td>` : ''}
                <td>${activity.startDate || '-'}</td>
                <td>${activity.finishDate || '-'}</td>
                <td>${activity.duration ? `${activity.duration} days` : '-'}</td>
                <td>
                  <span class="confidence-badge confidence-${activity.confidence}">
                    ${activity.confidence}
                  </span>
                </td>
                ${options.includeAIReasoning && activity.llm_confidence ? `
                <td>
                  <span class="ai-confidence ai-${activity.llm_confidence >= 0.7 ? 'high' : activity.llm_confidence >= 0.4 ? 'medium' : 'low'}">
                    🤖 ${Math.round(activity.llm_confidence * 100)}%
                  </span>
                </td>
                ` : options.includeAIReasoning ? '<td>-</td>' : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('')}

    ${options.includeAIReasoning && activities.some(a => a.llm_reasoning) ? `
      <div class="reasoning-section">
        <h3>🤖 AI Classification Reasoning</h3>
        ${activities.filter(a => a.llm_reasoning).slice(0, 10).map(activity => `
          <div class="reasoning-item">
            <div class="reasoning-activity">${activity.llm_suggestion || activity.name}</div>
            <div class="reasoning-text">${activity.llm_reasoning}</div>
          </div>
        `).join('')}
        ${activities.filter(a => a.llm_reasoning).length > 10 ? `
          <p style="font-style: italic; color: #999; margin-top: 15px;">
            Showing first 10 of ${activities.filter(a => a.llm_reasoning).length} AI-analyzed activities
          </p>
        ` : ''}
      </div>
    ` : ''}

    <footer>
      <p>Generated by SprinkSync Schedule Parser${options.includeAIReasoning ? ' with AI Enhancement' : ''}</p>
      <p>Report Date: ${reportDate}</p>
    </footer>
  </div>
</body>
</html>
  `

  return html
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Group activities by phase
 */
function groupActivitiesByPhase(activities: FireProtectionActivity[]): Record<string, FireProtectionActivity[]> {
  const phaseOrder = [
    'Mobilization',
    'Underground',
    'Overhead Rough-in',
    'Testing',
    'Inspections',
    'Trim & Final',
    'Commissioning',
    'Unknown'
  ]

  const grouped: Record<string, FireProtectionActivity[]> = {}

  phaseOrder.forEach(phase => {
    const phaseActivities = activities.filter(a => (a.llm_phase || a.phase) === phase)
    if (phaseActivities.length > 0) {
      grouped[phase] = phaseActivities
    }
  })

  return grouped
}

/**
 * Sort activities by specified criteria
 */
export function sortActivities(activities: FireProtectionActivity[], sortBy: 'date' | 'phase' | 'activity'): FireProtectionActivity[] {
  const sorted = [...activities]

  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
        return dateA - dateB
      })

    case 'phase':
      const phaseOrder = [
        'Mobilization',
        'Underground',
        'Overhead Rough-in',
        'Testing',
        'Inspections',
        'Trim & Final',
        'Commissioning',
        'Unknown'
      ]
      return sorted.sort((a, b) => {
        const phaseA = phaseOrder.indexOf(a.llm_phase || a.phase)
        const phaseB = phaseOrder.indexOf(b.llm_phase || b.phase)
        return phaseA - phaseB
      })

    case 'activity':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))

    default:
      return sorted
  }
}
