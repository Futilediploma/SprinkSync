import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

// Reusable StatCard Component
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  subtitle?: string
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  subtitle 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} p-3 rounded-full text-white mr-4`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Reusable EmptyState Component
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action 
}) => (
  <div className="text-center py-12">
    {icon && (
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
)

// Reusable StatusBadge Component
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'outline'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'default' 
}) => {
  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    
    const statusMap: Record<string, { color: string; icon: any }> = {
      'completed': { color: 'green', icon: CheckCircle },
      'approved': { color: 'green', icon: CheckCircle },
      'in progress': { color: 'blue', icon: Clock },
      'pending': { color: 'yellow', icon: Clock },
      'in-review': { color: 'yellow', icon: AlertCircle },
      'rejected': { color: 'red', icon: XCircle },
      'on hold': { color: 'gray', icon: AlertCircle },
      'planning': { color: 'gray', icon: Clock },
    }
    
    return statusMap[normalizedStatus] || { color: 'gray', icon: AlertCircle }
  }

  const { color, icon: Icon } = getStatusStyles(status)
  
  const colorClasses: Record<string, string> = {
    green: variant === 'outline' 
      ? 'text-green-700 bg-green-50 border-green-200' 
      : 'text-green-800 bg-green-100',
    blue: variant === 'outline' 
      ? 'text-blue-700 bg-blue-50 border-blue-200' 
      : 'text-blue-800 bg-blue-100',
    yellow: variant === 'outline' 
      ? 'text-yellow-700 bg-yellow-50 border-yellow-200' 
      : 'text-yellow-800 bg-yellow-100',
    red: variant === 'outline' 
      ? 'text-red-700 bg-red-50 border-red-200' 
      : 'text-red-800 bg-red-100',
    gray: variant === 'outline' 
      ? 'text-gray-700 bg-gray-50 border-gray-200' 
      : 'text-gray-800 bg-gray-100',
  }

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${colorClasses[color]}
      ${variant === 'outline' ? 'border' : ''}
    `}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </span>
  )
}

// Reusable Loading Component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}></div>
    </div>
  )
}

// Reusable Modal Container
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'lg' 
}) => {
  if (!isOpen) return null

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full ${widthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Reusable Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled,
  children,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {loading ? <span className="ml-2">Loading...</span> : children}
    </button>
  )
}

// Utility Functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}
