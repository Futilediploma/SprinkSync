import React, { useState, useEffect } from 'react'
import '../App.css'

interface TelemetrySettingsProps {
  onClose?: () => void
}

export function TelemetrySettings({ onClose }: TelemetrySettingsProps) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sprinksync_telemetry_enabled')
    setEnabled(stored === 'true')
  }, [])

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    localStorage.setItem('sprinksync_telemetry_enabled', checked.toString())
  }

  return (
    <div className="telemetry-settings">
      <div className="telemetry-header">
        <h3>Help Improve SprinkSync</h3>
        {onClose && (
          <button onClick={onClose} className="close-button" aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="telemetry-content">
        <div className="telemetry-option">
          <label className="telemetry-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <div className="telemetry-label">
            <strong>Share anonymous feedback</strong>
            <p className="telemetry-description">
              Help improve AI accuracy by sharing anonymous corrections when you 
              use the 👍/👎 buttons. No personal data or schedule details are sent.
            </p>
          </div>
        </div>

        <div className="telemetry-privacy">
          <h4>What's shared:</h4>
          <ul>
            <li>Activity text (e.g., "Install System")</li>
            <li>AI classification (Fire Protection: Yes/No)</li>
            <li>Your correction (Should be: Yes/No)</li>
            <li>Up to 2 nearby activities for context</li>
            <li>Timestamp</li>
          </ul>

          <h4>What's NOT shared:</h4>
          <ul>
            <li>Project names or identifiers</li>
            <li>Employee names or contact info</li>
            <li>Company information</li>
            <li>Full schedules or PDF files</li>
            <li>IP addresses or tracking cookies</li>
          </ul>

          <p className="telemetry-note">
            All data is anonymized and aggregated. You can disable this at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
