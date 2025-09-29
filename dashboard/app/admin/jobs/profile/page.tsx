'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UploadIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1/'

interface JobProfile {
  id: number
  name: string
  email: string
  phone: string
  location: string
  experience_years: number
  skills: string[]
  resume_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  summary: string
  created_at: string
  updated_at: string
}

interface ResumeUpload {
  file: File
  name: string
  size: number
}

export default function JobProfilePage() {
  const [profile, setProfile] = useState<JobProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resumeUpload, setResumeUpload] = useState<ResumeUpload | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      // This would typically fetch from a profile API endpoint
      // For now, we'll use mock data
      const mockProfile: JobProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
        experience_years: 5,
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'AWS'],
        resume_url: null,
        linkedin_url: 'https://linkedin.com/in/johndoe',
        portfolio_url: 'https://johndoe.dev',
        summary: 'Experienced software engineer with 5+ years in full-stack development.',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      }
      setProfile(mockProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${API}/jobs/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeUpload({
      file,
      name: file.name,
      size: file.size
    })
  }

  const uploadResume = async () => {
    if (!resumeUpload) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('resume', resumeUpload.file)

      const response = await fetch(`${API}/jobs/profile/upload-resume`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload resume')
      }

      const result = await response.json()
      setProfile(prev => prev ? { ...prev, resume_url: result.resume_url } : null)
      setResumeUpload(null)
      setSuccess('Resume uploaded successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (field: keyof JobProfile, value: string | number | string[]) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  const addSkill = (skill: string) => {
    if (!skill.trim()) return
    setProfile(prev => prev ? {
      ...prev,
      skills: [...prev.skills, skill.trim()]
    } : null)
  }

  const removeSkill = (index: number) => {
    setProfile(prev => prev ? {
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    } : null)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading profile...</div>
        </div>
      </Layout>
    )
  }

  if (error && !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </Layout>
    )
  }

  if (!profile) return null

  return (
    <Layout>
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Application Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your professional profile for job applications
            </p>
          </div>
          <button
            onClick={() => window.open('/admin/jobs/auto-apply', '_blank')}
            className="btn-primary"
          >
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            Auto Apply
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

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

        <form onSubmit={handleSave} className="max-w-4xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Personal Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={profile.experience_years}
                    onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={profile.linkedin_url || ''}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={profile.portfolio_url || ''}
                    onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    value={profile.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your professional background..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mt-8 card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Skills</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
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
                    placeholder="Add a skill..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
                      addSkill(input.value)
                      input.value = ''
                    }}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="mt-8 card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Resume</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {profile.resume_url ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-green-800">Resume uploaded</div>
                        <div className="text-sm text-green-600">
                          <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            View resume
                          </a>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile(prev => prev ? { ...prev, resume_url: null } : null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="resume-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload your resume
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
                            PDF, DOC, or DOCX files only
                          </span>
                        </label>
                        <input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {resumeUpload && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-blue-800">{resumeUpload.name}</div>
                        <div className="text-sm text-blue-600">
                          {(resumeUpload.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setResumeUpload(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={uploadResume}
                        disabled={uploading}
                        className="btn-primary"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
