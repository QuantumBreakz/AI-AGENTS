'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  CommandLineIcon,
  ArrowPathIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  UserIcon,
  BriefcaseIcon,
  ChartBarIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1'

interface JobApplication {
  id: number
  title: string
  company: string
  location: string
  status: string
  applied_at: string
  response: string | null
}

interface JobProfile {
  id: number
  name: string
  email: string
  phone: string
  resume_url: string | null
  skills: string[]
  experience: string
  updated_at: string
}

export default function JobsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [profile, setProfile] = useState<JobProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showUploadResume, setShowUploadResume] = useState(false)
  const [showAutoApply, setShowAutoApply] = useState(false)

  useEffect(() => {
    fetchJobsData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchJobsData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchJobsData = async () => {
    try {
      setLoading(true)
      
      // Fetch job profile
      const profileRes = await fetch(`${API}/jobs/profile`)
      const profileData = profileRes.ok ? await profileRes.json() : null
      
      // Ensure profile has all required fields with defaults
      if (profileData) {
        profileData.skills = profileData.skills || []
        profileData.experience = profileData.experience || ''
        profileData.name = profileData.name || ''
        profileData.email = profileData.email || ''
        profileData.phone = profileData.phone || ''
      }
      
      // Mock job applications data
      const mockApplications: JobApplication[] = [
        {
          id: 1,
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          status: 'Applied',
          applied_at: new Date().toISOString(),
          response: null
        },
        {
          id: 2,
          title: 'Full Stack Developer',
          company: 'StartupXYZ',
          location: 'Remote',
          status: 'Interview',
          applied_at: new Date(Date.now() - 86400000).toISOString(),
          response: 'Interview scheduled for next week'
        },
        {
          id: 3,
          title: 'Frontend Developer',
          company: 'Design Co',
          location: 'New York, NY',
          status: 'Rejected',
          applied_at: new Date(Date.now() - 172800000).toISOString(),
          response: 'Not a good fit for our current needs'
        }
      ]
      
      setProfile(profileData)
      setApplications(mockApplications)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching jobs data:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadResume = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${API}/jobs/profile/upload-resume`, {
        method: 'POST',
        body: formData,
      })
      
      if (res.ok) {
        fetchJobsData()
        setShowUploadResume(false)
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
    }
  }

  const startAutoApply = async (criteria: any) => {
    try {
      const res = await fetch(`${API}/jobs/auto-apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria),
      })
      
      if (res.ok) {
        fetchJobsData()
        setShowAutoApply(false)
      }
    } catch (error) {
      console.error('Error starting auto apply:', error)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your job profile and track applications
              {lastUpdated && (
                <span className="ml-2 text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
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
              onClick={fetchJobsData}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowUploadResume(true)}
              className="btn-secondary"
            >
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Resume
            </button>
            <button
              onClick={() => setShowAutoApply(true)}
              className="btn-primary"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Auto Apply
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : applications.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <PlayIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Applied</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : applications.filter(app => app.status === 'Applied').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Interview</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : applications.filter(app => app.status === 'Interview').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : applications.filter(app => app.status === 'Rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Profile */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Job Profile</h2>
          <div className="card">
            <div className="card-body">
              {profile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                      <p className="text-sm text-gray-500">{profile.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Last updated</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(profile.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills || []).map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Experience</h4>
                    <p className="text-sm text-gray-600">{profile.experience}</p>
                  </div>
                  {profile.resume_url && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Resume</h4>
                      <a 
                        href={profile.resume_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No profile found</h3>
                  <p className="mt-1 text-sm text-gray-500">Create your job profile to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Applications */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h2>
          <div className="card">
            <div className="card-body">
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <BriefcaseIcon className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{application.title}</h3>
                            <p className="text-sm text-gray-500">{application.company} • {application.location}</p>
                            <p className="text-xs text-gray-400">
                              Applied: {new Date(application.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            application.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'Interview' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </div>
                          {application.response && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                              {application.response}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Start applying to jobs to see your applications here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Resume Modal */}
        {showUploadResume && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Resume</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select Resume File</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          uploadResume(file)
                        }
                      }}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUploadResume(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto Apply Modal */}
        {showAutoApply && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Auto Apply Settings</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  startAutoApply({
                    keywords: formData.get('keywords') as string,
                    location: formData.get('location') as string,
                    max_applications: parseInt(formData.get('max_applications') as string)
                  })
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Keywords</label>
                      <input
                        type="text"
                        name="keywords"
                        placeholder="e.g., software engineer, python, react"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        name="location"
                        placeholder="e.g., San Francisco, Remote"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Applications</label>
                      <input
                        type="number"
                        name="max_applications"
                        min="1"
                        max="100"
                        defaultValue="10"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAutoApply(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Start Auto Apply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}