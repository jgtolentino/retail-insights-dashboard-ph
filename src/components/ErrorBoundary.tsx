import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error caught by ErrorBoundary:')
    console.error('Error message:', error.message)
    console.error('Error name:', error.name)
    console.error('Error stack:', error.stack)
    console.error('Component stack:', errorInfo.componentStack)
    console.error('Error info:', errorInfo)
    console.error('Full error object:', error)
    
    // Log environment for debugging
    console.error('Environment debug info:')
    console.error('- URL:', window.location.href)
    console.error('- User Agent:', navigator.userAgent)
    console.error('- Supabase URL set:', !!import.meta.env.VITE_SUPABASE_URL)
    console.error('- Supabase Key set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg m-4">
          <h2 className="text-lg font-semibold mb-2">🚨 Application Error</h2>
          <div className="text-sm space-y-2">
            <p><strong>Error:</strong> {this.state.error?.message || 'No error message provided'}</p>
            <p><strong>Name:</strong> {this.state.error?.name || 'Unknown'}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
            <details className="mt-3">
              <summary className="cursor-pointer font-medium">Stack Trace</summary>
              <pre className="mt-2 text-xs overflow-auto bg-red-100 p-2 rounded">
                {this.state.error?.stack || 'No stack trace available'}
              </pre>
            </details>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}