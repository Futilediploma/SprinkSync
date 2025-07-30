import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, Loader2, Brain, X } from 'lucide-react'

interface DocumentUploadProps {
  onDataExtracted: (data: any) => void
  onClose: () => void
}

interface ExtractionResult {
  success: boolean
  filename: string
  extracted_data: {
    [key: string]: any
    extraction_metadata?: {
      confidence_score: number
      source_filename: string
      extracted_at: string
      text_length: number
    }
  }
  message: string
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDataExtracted, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)

  const supportedFormats = ['.pdf', '.docx', '.doc']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    setError('')
    setExtractionResult(null)

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file type. Supported formats: ${supportedFormats.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError('File size too large. Maximum size is 10MB.')
      return
    }

    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelection(files[0])
    }
  }

  const extractProjectData = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('http://127.0.0.1:8001/api/documents/extract-project-data', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to extract data')
      }

      const result: ExtractionResult = await response.json()
      setExtractionResult(result)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the document')
    } finally {
      setIsUploading(false)
    }
  }

  const applyExtractedData = () => {
    if (extractionResult?.extracted_data) {
      onDataExtracted(extractionResult.extracted_data)
      onClose()
    }
  }

  const renderExtractionResult = () => {
    if (!extractionResult) return null

    const { extracted_data } = extractionResult
    const extraction_metadata = extracted_data.extraction_metadata
    const confidence = extraction_metadata?.confidence_score || 0

    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-500" />
            Extracted Project Data
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Confidence: {Math.round(confidence * 100)}%
            </span>
            <div className={`w-3 h-3 rounded-full ${
              confidence > 0.7 ? 'bg-green-500' : 
              confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          {Object.entries(extracted_data)
            .filter(([key, value]) => value !== null && value !== '' && key !== 'extraction_metadata')
            .slice(0, 8) // Show first 8 fields
            .map(([key, value]) => (
              <div key={key} className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-gray-900 truncate">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {Object.values(extracted_data).filter(v => v !== null && v !== '').length} fields extracted
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setExtractionResult(null)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Try Another File
            </button>
            <button
              onClick={applyExtractedData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Apply to Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🤖 Smart Document Upload & Auto-Fill
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Upload construction documents (contracts, permits, proposals) and let AI automatically 
          fill your project form with extracted information.
        </p>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-gray-900 font-medium">{selectedFile.name}</span>
              <span className="text-gray-500 text-sm">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Drag and drop your document here, or
              </p>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
                <input
                  type="file"
                  className="hidden"
                  accept={supportedFormats.join(',')}
                  onChange={handleFileInputChange}
                />
              </label>
            </>
          )}
        </div>

        {/* Supported Formats */}
        <div className="mt-4 text-sm text-gray-600">
          <strong>Supported formats:</strong> {supportedFormats.join(', ')} (max 10MB)
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Extract Button */}
        {selectedFile && !extractionResult && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={extractProjectData}
              disabled={isUploading}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Document...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Extract Project Data
                </>
              )}
            </button>
          </div>
        )}

        {/* Extraction Result */}
        {renderExtractionResult()}

        {/* Recommended Documents */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Recommended Documents:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Construction contracts & agreements</li>
            <li>• Project proposals & bids</li>
            <li>• Building permits & applications</li>
            <li>• Insurance documents & certificates</li>
            <li>• Scope of work documents</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DocumentUpload
