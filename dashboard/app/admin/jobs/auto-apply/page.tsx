'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  BriefcaseIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from "../../utils/date"

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface JobApplication {
  id: number
  job_title: string
  company: string
  location: string
  salary: string | null
  job_url: string
  status: 'pending' | 'applied' | 'rejected' | 'interview' | 'offer'
  applied_at: string | null
  response_received: boolean
  notes: string[]
  created_at: string
}

interface AutoApplySettings {
  enabled: boolean
  max_applications_per_day: number
  target_keywords: string[]
  exclude_keywords: string[]
  preferred_locations: string[]
  salary_minimum: number | null
  experience_level: string
  job_types: string[]
}

export default function AutoApplyPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [settings, setSettings] = useState<AutoApplySettings>({
    enabled: false,
    max_applications_per_day: 10,
    target_keywords: ['software engineer', 'developer', 'programmer'],
    exclude_keywords: ['senior', 'lead', 'manager'],
    preferred_locations: ['San Francisco', 'New York', 'Remote'],
    salary_minimum: null,
    experience_level: 'mid',
    job_types: ['full-time', 'contract']
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      // This would typically fetch from an applications API endpoint
      // For now, we'll use mock data
      const mockApplications: JobApplication[] = [
        {
          id: 1,
          job_title: 'Software Engineer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          salary: '$120,000 - $150,000',
          job_url: 'https://linkedin.com/jobs/view/123456',
          status: 'applied',
          applied_at: '2024-01-15T10:30:00Z',
          response_received: false,
          notes: ['Applied via auto-apply'],
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          job_title: 'Full Stack Developer',
          company: 'StartupXYZ',
          location: 'New York, NY',
          salary: '$100,000 - $130,000',
          job_url: 'https://linkedin.com/jobs/view/123457',
          status: 'pending',
          applied_at: null,
          response_received: false,
          notes: [],
          created_at: '2024-01-15T14:20:00Z'
        },
        {
          id: 3,
          job_title: 'React Developer',
          company: 'WebAgency',
          location: 'Remote',
          salary: '$90,000 - $120,000',
          job_url: 'https://linkedin.com/jobs/view/123458',
          status: 'interview',
          applied_at: '2024-01-16T09:15:00Z',
          response_received: true,
          notes: ['Interview scheduled for next week'],
          created_at: '2024-01-16T09:15:00Z'
        }
      ]
      setApplications(mockApplications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startAutoApply = async () => {
    try {
      setApplying(true)
      const response = await fetch(`${API}/jobs/auto-apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to start auto-apply')
      }

      const result = await response.json()
      console.log('Auto-apply started:', result)
      fetchApplications() // Refresh applications
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setApplying(false)
    }
  }

  const stopAutoApply = async () => {
    try {
      setSettings(prev => ({ ...prev, enabled: false }))
      // This would call an API to stop auto-apply
      console.log('Auto-apply stopped')
    } catch (err) {
      console.error('Failed to stop auto-apply:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'badge-warning',
      applied: 'badge-info',
      rejected: 'badge-danger',
      interview: 'badge-success',
      offer: 'badge-success'
    }
    return `badge ${styles[status as keyof typeof styles] || 'badge-info'}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'interview':
        return <ClockIcon className="h-4 w-4" />
      case 'offer':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    const matchesSearch = !searchTerm || 
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading applications...</div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auto Apply Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Automatically apply to relevant job opportunities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {settings.enabled ? (
              <button
                onClick={stopAutoApply}
                className="btn-danger"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Stop Auto Apply
              </button>
            ) : (
              <button
                onClick={startAutoApply}
                disabled={applying}
                className="btn-primary"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                {applying ? 'Starting...' : 'Start Auto Apply'}
              </button>
            )}
          </div>
        </div>

        {/* Auto Apply Status */}
        <div className="mb-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Auto Apply Status</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-3 ${settings.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {settings.enabled ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-gray-500">Auto Apply Status</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {settings.max_applications_per_day}
                </div>
                <div className="text-sm text-gray-500">Max Applications/Day</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {applications.filter(app => app.status === 'applied').length}
                </div>
                <div className="text-sm text-gray-500">Applications Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mb-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Auto Apply Settings</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Applications Per Day
                </label>
                <input
                  type="number"
                  value={settings.max_applications_per_day}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_applications_per_day: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={settings.experience_level}
                  onChange={(e) => setSettings(prev => ({ ...prev, experience_level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Keywords
                </label>
                <textarea
                  value={settings.target_keywords.join(', ')}
                  onChange={(e) => setSettings(prev => ({ ...prev, target_keywords: e.target.value.split(', ').filter(k => k.trim()) }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="software engineer, developer, programmer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Keywords
                </label>
                <textarea
                  value={settings.exclude_keywords.join(', ')}
                  onChange={(e) => setSettings(prev => ({ ...prev, exclude_keywords: e.target.value.split(', ').filter(k => k.trim()) }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="senior, lead, manager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                    <dd className="text-lg font-medium text-gray-900">{applications.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Applied</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'applied').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Interviews</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'interview').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Offers</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'offer').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{application.job_title}</h3>
                      <span className={getStatusBadge(application.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(application.status)}
                          <span className="ml-1">{application.status}</span>
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      <span className="mr-4">{application.company}</span>
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span className="mr-4">{application.location}</span>
                      {application.salary && (
                        <>
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <span>{application.salary}</span>
                        </>
                      )}
                    </div>

                    {application.applied_at && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Applied {formatDate(application.applied_at), 'MMM dd, yyyy')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Notes: {application.notes.length}</span>
                        {application.response_received && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-green-600">Response received</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Job
                        </a>
                        {application.status === 'pending' && (
                          <button className="btn-primary text-sm">
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="mt-8 text-center">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search criteria.'
                : 'Start auto-apply to begin finding and applying to jobs automatically.'
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
