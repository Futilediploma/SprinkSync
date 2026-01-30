import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { parsePDF } from './utils/pdfParser'
import { checkLLMHealth, submitCorrection } from './utils/llmService'
import { exportToPDF, exportToCSV, type ExportOptions } from './utils/exportSchedule'
import { TelemetrySettings } from './components/TelemetrySettings'
import type { FireProtectionActivity } from './types'
import './App.css'

function App() {
  const [activities, setActivities] = useState<FireProtectionActivity[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [llmAvailable, setLlmAvailable] = useState<boolean>(false)
  const [useLLM, setUseLLM] = useState<boolean>(true)
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    groupByPhase: true,
    includeAIReasoning: true,
    sortBy: 'phase'
  })

  // Check LLM availability on mount
  useEffect(() => {
    checkLLMHealth().then(setLlmAvailable).catch(() => setLlmAvailable(false))
  }, [])

  const toggleReasoning = (index: number) => {
    setActivities(prev => prev.map((activity, i) => 
      i === index ? { ...activity, showReasoning: !activity.showReasoning } : activity
    ))
  }

  const handleCorrection = async (
    activity: FireProtectionActivity,
    index: number,
    shouldBeFP: boolean
  ) => {
    try {
      // Get context from surrounding activities
      const context: string[] = []
      if (index > 0) context.push(activities[index - 1].name)
      if (index < activities.length - 1) context.push(activities[index + 1].name)

      await submitCorrection(
        activity.name,
        context,
        activity.llm_classification ?? true,
        shouldBeFP,
        'User correction from UI'
      )

      alert('Thank you! Your correction helps improve the AI.')
    } catch (error) {
      console.error('Error submitting correction:', error)
      alert('Failed to submit correction. Please try again.')
    }
  }

  const handleExport = (format: 'pdf' | 'csv') => {
    if (activities.length === 0) return

    const options: ExportOptions = {
      ...exportOptions,
      projectName: fileName.replace('.pdf', ''),
      reportDate: new Date().toLocaleDateString(),
      includeAIReasoning: llmAvailable && exportOptions.includeAIReasoning
    }

    switch (format) {
      case 'pdf':
        exportToPDF(activities, options)
        break

      case 'csv':
        exportToCSV(activities, options)
        break

      default:
        return
    }

    setShowExportMenu(false)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFileName(file.name)
    setIsProcessing(true)

    try {
      const parsedActivities = await parsePDF(file, useLLM && llmAvailable)
      setActivities(parsedActivities)
    } catch (error) {
      console.error('Error parsing PDF:', error)
      alert('Sorry, there was an error parsing your schedule. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [useLLM, llmAvailable])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  return (
    <div className="app">
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <TelemetrySettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      <header className="header">
        <div className="logo">
          <span className="logo-mark">S</span>
          <h1>Schedule Extractor</h1>
          {llmAvailable && (
            <span className="llm-badge" title="Local AI Enhanced">
              🤖 AI Enhanced
            </span>
          )}
          <button 
            className="settings-button"
            onClick={() => setShowSettings(true)}
            title="Settings"
            aria-label="Open settings"
          >
            ⚙️
          </button>
        </div>
        <p className="tagline">Extract fire protection activities from construction schedules with AI intelligence</p>
        
        {llmAvailable && (
          <div className="llm-toggle">
            <label>
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
              />
              Use AI Enhancement
            </label>
          </div>
        )}
      </header>

      <main className="main">
        {activities.length === 0 ? (
          <div className="upload-section">
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="processing">
                  <div className="spinner"></div>
                  <p>Reading your schedule...</p>
                  <p className="hint">Looking for fire protection activities</p>
                </div>
              ) : (
                <div className="drop-content">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="12" y="8" width="40" height="48" rx="2" stroke="#FF6B6B" strokeWidth="2"/>
                    <path d="M20 16 L44 16 M20 24 L44 24 M20 32 L36 32" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="48" cy="48" r="10" fill="#FF6B6B"/>
                    <path d="M48 42 L48 54 M42 48 L54 48" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {isDragActive ? (
                    <p className="drop-text">Drop your schedule here</p>
                  ) : (
                    <>
                      <p className="drop-text">Drag and drop your construction schedule</p>
                      <p className="drop-hint">or click to browse</p>
                      <p className="supported">Supports PDF schedules from Primavera, MS Project, and more</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="features">
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <h3>Smart Detection</h3>
                <p>Automatically finds sprinkler, fire alarm, and FP testing activities</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📅</span>
                <h3>Date Parsing</h3>
                <p>Handles messy date formats and extracts start/finish dates</p>
              </div>
              <div className="feature">
                <span className="feature-icon">✅</span>
                <h3>Inspection Tracking</h3>
                <p>Flags critical testing, inspections, and compliance milestones</p>
              </div>
              {llmAvailable && (
                <div className="feature feature-highlight">
                  <span className="feature-icon">🤖</span>
                  <h3>AI Intelligence</h3>
                  <p>Local LLM understands vague terms like "MEP rough" and "ceiling work"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <div>
                <h2>Fire Protection Activities</h2>
                <p className="file-name">From: {fileName}</p>
              </div>
              <div className="header-actions">
                <div className="export-dropdown">
                  <button
                    className="btn-export"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    📥 Export
                  </button>
                  {showExportMenu && (
                    <div className="export-menu">
                      <div className="export-options">
                        <h4>Export Options</h4>
                        <label>
                          <input
                            type="checkbox"
                            checked={exportOptions.groupByPhase}
                            onChange={(e) => setExportOptions({...exportOptions, groupByPhase: e.target.checked})}
                          />
                          Group by Phase
                        </label>
                        {llmAvailable && (
                          <label>
                            <input
                              type="checkbox"
                              checked={exportOptions.includeAIReasoning}
                              onChange={(e) => setExportOptions({...exportOptions, includeAIReasoning: e.target.checked})}
                            />
                            Include AI Reasoning
                          </label>
                        )}
                        <label>
                          Sort by:
                          <select
                            value={exportOptions.sortBy}
                            onChange={(e) => setExportOptions({...exportOptions, sortBy: e.target.value as any})}
                          >
                            <option value="phase">Phase</option>
                            <option value="date">Date</option>
                            <option value="activity">Activity Name</option>
                          </select>
                        </label>
                      </div>
                      <div className="export-formats">
                        <button onClick={() => handleExport('pdf')} className="export-btn pdf">
                          📄 PDF Document
                        </button>
                        <button onClick={() => handleExport('csv')} className="export-btn csv">
                          📊 CSV Spreadsheet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="btn-new"
                  onClick={() => {
                    setActivities([])
                    setFileName('')
                    setShowExportMenu(false)
                  }}
                >
                  Parse Another Schedule
                </button>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <span className="stat-number">{activities.length}</span>
                <span className="stat-label">Activities Found</span>
              </div>
              <div className="stat">
                <span className="stat-number">{activities.filter(a => a.phase === 'Testing').length}</span>
                <span className="stat-label">Testing & Inspections</span>
              </div>
              <div className="stat">
                <span className="stat-number">{activities.filter(a => a.confidence === 'high').length}</span>
                <span className="stat-label">High Confidence</span>
              </div>
              {llmAvailable && (
                <div className="stat stat-llm">
                  <span className="stat-number">
                    {activities.filter(a => a.llm_confidence && a.llm_confidence >= 0.7).length}
                  </span>
                  <span className="stat-label">AI Verified</span>
                </div>
              )}
            </div>

            <div className="activities-list">
              {activities.map((activity, index) => (
                <div key={index} className={`activity-card confidence-${activity.confidence}`}>
                  <div className="activity-header">
                    <span className={`phase-badge phase-${activity.phase.toLowerCase().replace(/\s+/g, '-')}`}>
                      {activity.llm_phase || activity.phase}
                    </span>
                    {activity.confidence === 'high' && <span className="confidence-badge">✓</span>}
                    {activity.llm_confidence !== undefined && (
                      <span 
                        className={`llm-confidence ${activity.llm_confidence >= 0.7 ? 'high' : activity.llm_confidence >= 0.4 ? 'medium' : 'low'}`}
                        title={`AI Confidence: ${Math.round(activity.llm_confidence * 100)}%`}
                      >
                        🤖 {Math.round(activity.llm_confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <h3 className="activity-name">
                    {activity.llm_suggestion || activity.name}
                  </h3>
                  {activity.llm_suggestion && activity.llm_suggestion !== activity.name && (
                    <p className="original-name">Original: {activity.name}</p>
                  )}
                  {activity.activityId && (
                    <p className="activity-id">ID: {activity.activityId}</p>
                  )}
                  <div className="activity-dates">
                    {activity.startDate && (
                      <span>Start: {activity.startDate}</span>
                    )}
                    {activity.finishDate && (
                      <span>Finish: {activity.finishDate}</span>
                    )}
                    {activity.duration && (
                      <span>Duration: {activity.duration} days</span>
                    )}
                  </div>
                  {activity.keywords && activity.keywords.length > 0 && (
                    <div className="keywords">
                      {activity.keywords.map((keyword, i) => (
                        <span key={i} className="keyword">{keyword}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* LLM Reasoning Section */}
                  {activity.llm_reasoning && (
                    <div className="llm-reasoning-section">
                      <button
                        className="reasoning-toggle"
                        onClick={() => toggleReasoning(index)}
                      >
                        {activity.showReasoning ? '▼' : '▶'} AI Reasoning
                      </button>
                      {activity.showReasoning && (
                        <div className="reasoning-content">
                          <p className="reasoning-text">{activity.llm_reasoning}</p>
                          <div className="reasoning-actions">
                            <button
                              className="btn-feedback btn-correct"
                              onClick={() => handleCorrection(activity, index, true)}
                              title="This is correct"
                            >
                              👍 Correct
                            </button>
                            <button
                              className="btn-feedback btn-incorrect"
                              onClick={() => handleCorrection(activity, index, false)}
                              title="This is incorrect"
                            >
                              👎 Incorrect
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
