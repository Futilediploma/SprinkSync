import { useState, useEffect, useCallback } from 'react'
import { sharepointSyncApi } from '../api'
import type { SyncLog, SyncStatus } from '../types'

function formatDatetime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function StatusBadge({ status }: { status: SyncLog['status'] }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="text-green-500">✓</span> Success
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <span className="text-red-500">✕</span> Error
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <span className="animate-spin inline-block">⟳</span> Running
    </span>
  )
}

export default function SharePointSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        sharepointSyncApi.getStatus(),
        sharepointSyncApi.getLogs(),
      ])
      setStatus(statusRes.data)
      setLogs(logsRes.data)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load sync status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleSyncNow = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await sharepointSyncApi.triggerSync()
      setSyncMessage(res.data.message)
      // Reload data after a short delay to pick up the new sync log
      setTimeout(loadData, 2000)
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to trigger sync'
      setSyncMessage(`Error: ${detail}`)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">SharePoint Import</h2>
        <p className="text-sm text-gray-500 mt-1">
          Automatically import projects from the BFPE Pipeline Tracker Excel file via rclone.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Warning banner if not configured */}
      {status && !status.configured && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <span className="text-amber-500 text-lg leading-none">⚠</span>
          <div>
            <strong>rclone not configured.</strong> Set{' '}
            <code className="bg-amber-100 px-1 rounded">SHAREPOINT_FILE_REMOTE_PATH</code> in your{' '}
            <code className="bg-amber-100 px-1 rounded">.env</code> file and configure rclone on the server.
            See the setup guide for details.
          </div>
        </div>
      )}

      {/* Status Card */}
      {status && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Configuration</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Configured</p>
              <p className={`mt-1 text-sm font-semibold ${status.configured ? 'text-green-600' : 'text-red-500'}`}>
                {status.configured ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto-Sync</p>
              <p className={`mt-1 text-sm font-semibold ${status.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {status.enabled ? `Every ${status.sync_interval_minutes} min` : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Sync</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                {status.enabled ? formatCountdown(status.next_sync_in_seconds) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Min Probability</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">{status.min_probability}%</p>
            </div>
          </div>

          {status.last_sync && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Last Sync</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge status={status.last_sync.status} />
                <span className="text-gray-600">{formatDatetime(status.last_sync.completed_at)}</span>
                <span className="text-green-700">+{status.last_sync.projects_created} created</span>
                <span className="text-blue-700">~{status.last_sync.projects_updated} updated</span>
                <span className="text-gray-500">{status.last_sync.projects_skipped} unchanged</span>
                <span className="text-gray-500">{status.last_sync.rows_processed} rows</span>
              </div>
              {status.last_sync.error_message && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">
                  {status.last_sync.error_message}
                </p>
              )}
            </div>
          )}

          {/* Sync Now Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncNow}
              disabled={syncing || !status.configured}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                syncing || !status.configured
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {syncing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Syncing...
                </span>
              ) : (
                'Sync Now'
              )}
            </button>
            {syncMessage && (
              <p className={`text-sm ${syncMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {syncMessage}
              </p>
            )}
          </div>

          {/* Remote path info */}
          {status.file_path && (
            <p className="mt-3 text-xs text-gray-400">
              Remote: <code className="bg-gray-100 px-1 rounded">{status.rclone_remote}:{status.file_path}</code>
            </p>
          )}
        </div>
      )}

      {/* Sync History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sync History</h3>
          <button
            onClick={loadData}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No sync history yet. Click "Sync Now" to run the first import.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date / Time</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Trigger</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Created</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Updated</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Unchanged</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Rows</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDatetime(log.started_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        log.trigger === 'manual'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {log.trigger === 'manual' ? 'Manual' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">
                      {log.projects_created > 0 ? `+${log.projects_created}` : log.projects_created}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700 font-medium">
                      {log.projects_updated}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {log.projects_skipped}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {log.rows_processed}
                    </td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate">
                      {log.error_message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
