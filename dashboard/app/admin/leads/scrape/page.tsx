'use client'

import { useState } from 'react'
import Layout from '../../../components/Layout'
import { 
  MagnifyingGlassIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface ScrapingTarget {
  source: string
  keywords: string[]
  location: string
  industry: string
  company_size: string
  max_results: number
}

interface ScrapedLead {
  id: number
  name: string
  email: string
  company: string
  title: string
  location: string
  linkedin_url: string
  source: string
  confidence_score: number
}

interface ScrapingSession {
  id: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  total_found: number
  leads: ScrapedLead[]
  error_message?: string
}

export default function ScrapeLeadsPage() {
  const [target, setTarget] = useState<ScrapingTarget>({
    source: 'linkedin',
    keywords: ['software engineer', 'developer'],
    location: 'San Francisco',
    industry: 'Technology',
    company_size: '51-200',
    max_results: 50
  })
  const [session, setSession] = useState<ScrapingSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleInputChange = (field: keyof ScrapingTarget, value: string | string[] | number) => {
    setTarget(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addKeyword = (keyword: string) => {
    if (!keyword.trim()) return
    setTarget(prev => ({
      ...prev,
      keywords: [...prev.keywords, keyword.trim()]
    }))
  }

  const removeKeyword = (index: number) => {
    setTarget(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const startScraping = async () => {
    try {
      setLoading(true)
      setError(null)
      setShowResults(false)

      const response = await fetch(`${API}/leads/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(target),
      })

      if (!response.ok) {
        throw new Error('Failed to start scraping')
      }

      const result = await response.json()
      console.log('Scraping started:', result)
      
      // Create a new session
      const newSession: ScrapingSession = {
        id: `session_${Date.now()}`,
        status: 'running',
        started_at: new Date().toISOString(),
        total_found: 0,
        leads: []
      }
      
      setSession(newSession)
      
      // Simulate progress updates
      setTimeout(() => {
        setSession(prev => prev ? {
          ...prev,
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_found: 25,
          leads: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john@techcorp.com',
              company: 'TechCorp',
              title: 'Senior Software Engineer',
              location: 'San Francisco, CA',
              linkedin_url: 'https://linkedin.com/in/johndoe',
              source: 'LinkedIn',
              confidence_score: 85
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane@startupxyz.com',
              company: 'StartupXYZ',
              title: 'Full Stack Developer',
              location: 'San Francisco, CA',
              linkedin_url: 'https://linkedin.com/in/janesmith',
              source: 'LinkedIn',
              confidence_score: 92
            }
          ]
        } : null)
        setShowResults(true)
        setLoading(false)
      }, 5000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'running':
        return <ClockIcon className="h-5 w-5 text-yellow-600 animate-spin" />
      default:
        return <PlayIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      running: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scrape Leads</h1>
            <p className="mt-1 text-sm text-gray-500">
              Find and scrape leads from various sources
            </p>
          </div>
          <button
            onClick={startScraping}
            disabled={loading}
            className="btn-primary"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            {loading ? 'Scraping...' : 'Start Scraping'}
          </button>
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Scraping Configuration */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Scraping Configuration</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={target.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="apollo">Apollo</option>
                  <option value="crunchbase">Crunchbase</option>
                  <option value="generic">Generic Web</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {target.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addKeyword((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
                      addKeyword(input.value)
                      input.value = ''
                    }}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={target.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={target.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={target.company_size}
                    onChange={(e) => handleInputChange('company_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Results
                  </label>
                  <input
                    type="number"
                    value={target.max_results}
                    onChange={(e) => handleInputChange('max_results', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Session */}
          {session && (
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Scraping Session</h3>
                  <span className={getStatusBadge(session.status)}>
                    <span className="flex items-center">
                      {getStatusIcon(session.status)}
                      <span className="ml-1">{session.status}</span>
                    </span>
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-sm text-gray-500">Session ID</div>
                      <div className="text-sm font-medium text-gray-900">{session.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Started</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(session.started_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="text-sm font-medium text-gray-900">
                        {session.completed_at 
                          ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000)}s`
                          : 'Running...'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Total Found</div>
                        <div className="text-2xl font-bold text-gray-900">{session.total_found}</div>
                      </div>
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  {session.error_message && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {session.error_message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {showResults && session && session.leads.length > 0 && (
          <div className="mt-8 card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Scraped Leads ({session.leads.length})</h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {session.leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getConfidenceColor(lead.confidence_score)}`}>
                            {lead.confidence_score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            Import
                          </button>
                          <a
                            href={lead.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!session && (
          <div className="mt-8 text-center">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scraping session</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure your scraping parameters and start a new session.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
