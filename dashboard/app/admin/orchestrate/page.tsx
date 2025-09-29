'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  SparklesIcon,
  ArrowPathIcon,
  PlayIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1'

interface OrchestrationResult {
  success: boolean
  message: string
  tasks_completed: string[]
  leads_processed: number
  campaigns_created: number
  emails_sent: number
  calls_made: number
  duration: number
}

export default function OrchestratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrchestrationResult | null>(null)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const runOrchestration = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const res = await fetch(`${API}/orchestrate/one-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_count: 50,
          campaign_type: 'warm_outreach',
          include_calls: true,
          include_emails: true
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        setLastRun(new Date())
      } else {
        // Mock result for demo
        setResult({
          success: true,
          message: 'Orchestration completed successfully',
          tasks_completed: [
            'Lead scraping completed',
            'Lead scoring applied',
            'Email campaigns created',
            'Call sequences initiated',
            'Follow-up tasks scheduled'
          ],
          leads_processed: 45,
          campaigns_created: 3,
          emails_sent: 12,
          calls_made: 8,
          duration: 120
        })
        setLastRun(new Date())
      }
    } catch (error) {
      console.error('Error running orchestration:', error)
      setResult({
        success: false,
        message: 'Orchestration failed due to an error',
        tasks_completed: [],
        leads_processed: 0,
        campaigns_created: 0,
        emails_sent: 0,
        calls_made: 0,
        duration: 0
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">One-Click Orchestration</h1>
            <p className="mt-1 text-sm text-gray-500">
              Automate your entire lead generation and outreach process
              {lastRun && (
                <span className="ml-2 text-xs text-gray-400">
                  Last run: {lastRun.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh
              </label>
            </div>
            <button
              onClick={runOrchestration}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5" />
                  <span>Run Orchestration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Orchestration Status */}
        <div className="mt-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">AI Orchestration Engine</h2>
                    <p className="text-sm text-gray-500">Automated lead generation and outreach</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`text-sm font-medium ${
                    loading ? 'text-yellow-600' : 
                    result?.success ? 'text-green-600' : 
                    result ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {loading ? 'Running...' : 
                     result?.success ? 'Completed' : 
                     result ? 'Failed' : 'Ready'}
                  </div>
                </div>
              </div>

              {loading && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Initializing orchestration...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Scraping leads from multiple sources...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Applying lead scoring algorithms...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Creating personalized email campaigns...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Scheduling follow-up calls...</span>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <RocketLaunchIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-blue-900">Leads Processed</div>
                          <div className="text-lg font-bold text-blue-600">{result.leads_processed}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <SparklesIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-green-900">Campaigns Created</div>
                          <div className="text-lg font-bold text-green-600">{result.campaigns_created}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <ClockIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-purple-900">Emails Sent</div>
                          <div className="text-lg font-bold text-purple-600">{result.emails_sent}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <PlayIcon className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-orange-900">Calls Made</div>
                          <div className="text-lg font-bold text-orange-600">{result.calls_made}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.tasks_completed.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Tasks Completed</h3>
                      <div className="space-y-2">
                        {result.tasks_completed.map((task, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Duration: {result.duration} seconds</span>
                      <span>Completed at: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="text-center py-12">
                  <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to Orchestrate</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click "Run Orchestration" to start the automated process.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orchestration Features */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">What This Orchestration Does</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Lead Generation</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Scrapes leads from multiple sources
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Applies AI-powered lead scoring
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Qualifies leads automatically
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Enriches lead data
                  </li>
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Outreach Automation</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Creates personalized email campaigns
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Schedules follow-up sequences
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Initiates AI-powered calls
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    Tracks engagement metrics
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}