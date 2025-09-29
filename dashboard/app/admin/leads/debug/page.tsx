'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  BugAntIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface ScraperResult {
  scraper_name: string
  status: 'success' | 'error' | 'running'
  results_count: number
  execution_time: number
  error_message?: string
  sample_data?: any[]
}

interface DebugSession {
  id: string
  started_at: string
  completed_at?: string
  status: 'running' | 'completed' | 'failed'
  results: ScraperResult[]
}

export default function DebugScrapersPage() {
  const [sessions, setSessions] = useState<DebugSession[]>([])
  const [currentSession, setCurrentSession] = useState<DebugSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetchDebugSessions()
  }, [])

  const fetchDebugSessions = async () => {
    try {
      // This would typically fetch from a debug sessions API
      // For now, we'll use mock data
      const mockSessions: DebugSession[] = [
        {
          id: 'session_1',
          started_at: '2024-01-20T10:30:00Z',
          completed_at: '2024-01-20T10:32:00Z',
          status: 'completed',
          results: [
            {
              scraper_name: 'LinkedIn Scraper',
              status: 'success',
              results_count: 25,
              execution_time: 45,
              sample_data: [
                { name: 'John Doe', company: 'TechCorp', title: 'CEO' },
                { name: 'Jane Smith', company: 'StartupXYZ', title: 'CTO' }
              ]
            },
            {
              scraper_name: 'Apollo Scraper',
              status: 'success',
              results_count: 18,
              execution_time: 32,
              sample_data: [
                { name: 'Bob Johnson', company: 'BigCorp', title: 'VP Sales' }
              ]
            }
          ]
        }
      ]
      setSessions(mockSessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const startDebugSession = async () => {
    try {
      setRunning(true)
      setError(null)

      const response = await fetch(`${API}/leads/debug-scrapers`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to start debug session')
      }

      const result = await response.json()
      console.log('Debug session started:', result)
      
      // Create a new session
      const newSession: DebugSession = {
        id: `session_${Date.now()}`,
        started_at: new Date().toISOString(),
        status: 'running',
        results: []
      }
      
      setCurrentSession(newSession)
      setSessions(prev => [newSession, ...prev])
      
      // Simulate progress updates
      setTimeout(() => {
        setCurrentSession(prev => prev ? {
          ...prev,
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: [
            {
              scraper_name: 'LinkedIn Scraper',
              status: 'success',
              results_count: 15,
              execution_time: 30,
              sample_data: [
                { name: 'Test User', company: 'Test Corp', title: 'Test Title' }
              ]
            }
          ]
        } : null)
        setRunning(false)
      }, 5000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRunning(false)
    }
  }

  const testMockScraping = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API}/leads/test-mock-scraping`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to test mock scraping')
      }

      const result = await response.json()
      console.log('Mock scraping test result:', result)
      
      // Add result to current session or create new one
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          results: [
            ...prev.results,
            {
              scraper_name: 'Mock Scraper',
              status: 'success',
              results_count: result.count || 0,
              execution_time: result.execution_time || 0,
              sample_data: result.sample_data || []
            }
          ]
        } : null)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'running':
        return <ClockIcon className="h-5 w-5 text-yellow-600 animate-spin" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'badge-success',
      error: 'badge-danger',
      running: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Debug Scrapers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Test and debug lead scraping functionality
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={testMockScraping}
              disabled={loading}
              className="btn-secondary"
            >
              <BugAntIcon className="h-5 w-5 mr-2" />
              {loading ? 'Testing...' : 'Test Mock Scraping'}
            </button>
            <button
              onClick={startDebugSession}
              disabled={running}
              className="btn-primary"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {running ? 'Running...' : 'Start Debug Session'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Session */}
        {currentSession && (
          <div className="mb-8 card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Current Debug Session</h3>
                <span className={getStatusBadge(currentSession.status)}>
                  {currentSession.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-sm text-gray-500">Session ID</div>
                    <div className="text-sm font-medium text-gray-900">{currentSession.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Started</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(currentSession.started_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="text-sm font-medium text-gray-900">
                      {currentSession.completed_at 
                        ? `${Math.round((new Date(currentSession.completed_at).getTime() - new Date(currentSession.started_at).getTime()) / 1000)}s`
                        : 'Running...'
                      }
                    </div>
                  </div>
                </div>

                {currentSession.results.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Scraper Results</h4>
                    <div className="space-y-3">
                      {currentSession.results.map((result, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              {getStatusIcon(result.status)}
                              <span className="ml-2 text-md font-medium text-gray-900">
                                {result.scraper_name}
                              </span>
                            </div>
                            <span className={getStatusBadge(result.status)}>
                              {result.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Results:</span>
                              <span className="ml-1 font-medium">{result.results_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Time:</span>
                              <span className="ml-1 font-medium">{result.execution_time}s</span>
                            </div>
                          </div>

                          {result.error_message && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              {result.error_message}
                            </div>
                          )}

                          {result.sample_data && result.sample_data.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">Sample Data:</div>
                              <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs text-gray-600 overflow-x-auto">
                                  {JSON.stringify(result.sample_data.slice(0, 3), null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Sessions History */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Debug Sessions History</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Session {session.id}</h4>
                      <p className="text-sm text-gray-600">
                        Started: {new Date(session.started_at).toLocaleString()}
                        {session.completed_at && (
                          <span className="ml-2">
                            • Completed: {new Date(session.completed_at).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={getStatusBadge(session.status)}>
                      {session.status}
                    </span>
                  </div>

                  {session.results.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {session.results.map((result, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center mb-2">
                            {getStatusIcon(result.status)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {result.scraper_name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Results: {result.results_count}</div>
                            <div>Time: {result.execution_time}s</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="text-center py-8">
                  <BugAntIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No debug sessions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start a debug session to test your scrapers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
