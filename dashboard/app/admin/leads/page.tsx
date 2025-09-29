'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/date'

const API = (process.env.NEXT_PUBLIC_AGENT2_API_URL as string) || 'http://localhost:8001/api/v1'

interface Lead {
  id: number
  name: string | null
  email: string | null
  company: string | null
  role: string | null
  linkedin_url: string | null
  source: string | null
  company_size: string | null
  industry: string | null
  location: string | null
  stage: string
  created_at: string
  updated_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual'
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchLeads()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchLeads()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/leads/`)
      if (!res.ok) throw new Error('Failed to load leads')
      const data = await res.json()
      setLeads(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addLead = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/leads/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLead),
      })
      
      if (res.ok) {
        setNewLead({ name: '', email: '', phone: '', company: '', source: 'manual' })
        setShowAddForm(false)
        fetchLeads()
        alert('Lead added successfully!')
      } else {
        alert('Failed to add lead. Please try again.')
      }
    } catch (error) {
      console.error('Error adding lead:', error)
      alert('Error adding lead. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteLead = async (leadId: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    
    try {
      setLoading(true)
      const res = await fetch(`${API}/leads/${leadId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        fetchLeads()
        alert('Lead deleted successfully!')
      } else {
        alert('Failed to delete lead. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Error deleting lead. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scrapeLeads = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/leads/scrape?company_size=10-50&role=CEO&industry=Technology&limit=50`, {
        method: 'POST'
      })
      
      if (res.ok) {
        alert('Lead scraping started! This may take a few minutes.')
        fetchLeads()
      } else {
        alert('Failed to start lead scraping. Please try again.')
      }
    } catch (error) {
      console.error('Error scraping leads:', error)
      alert('Error scraping leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStage = filterStage === 'all' || lead.stage === filterStage
    
    return matchesSearch && matchesStage
  })

  const getStageBadge = (stage: string) => {
    const styles = {
      new: 'badge-info',
      contacted: 'badge-warning',
      qualified: 'badge-success',
      unqualified: 'badge-danger'
    }
    return `badge ${styles[stage as keyof typeof styles] || 'badge-info'}`
  }


  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading leads...</div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your lead database and track progress
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
              onClick={fetchLeads}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
                <button
                  onClick={scrapeLeads}
                  disabled={loading}
                  className="btn-secondary mr-2"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Scrape Leads
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Lead
                </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
            </select>
            <button className="btn-secondary">
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                    <dd className="text-lg font-medium text-gray-900">{leads.length}</dd>
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
                    <span className="text-green-600 font-semibold">N</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">New</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {leads.filter(l => l.stage === 'new').length}
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
                    <span className="text-yellow-600 font-semibold">C</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Contacted</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {leads.filter(l => l.stage === 'contacted').length}
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
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">Q</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Qualified</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {leads.filter(l => l.stage === 'qualified').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">All Leads ({filteredLeads.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Stage</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="table td">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.location || 'No location'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table td">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {lead.company || 'Unknown'}
                        </span>
                      </div>
                      {lead.company_size && (
                        <div className="text-xs text-gray-500 mt-1">
                          {lead.company_size}
                        </div>
                      )}
                    </td>
                    <td className="table td">
                      <span className="text-sm text-gray-900">
                        {lead.role || 'Unknown'}
                      </span>
                      {lead.industry && (
                        <div className="text-xs text-gray-500 mt-1">
                          {lead.industry}
                        </div>
                      )}
                    </td>
                    <td className="table td">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {lead.email || 'No email'}
                        </span>
                      </div>
                    </td>
                    <td className="table td">
                      <span className={getStageBadge(lead.stage)}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="table td">
                      <span className="text-sm text-gray-900">
                        {lead.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="table td">
                      <span className="text-sm text-gray-900">
                        {formatDate(lead.created_at)}
                      </span>
                    </td>
                    <td className="table td">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            // TODO: Implement edit functionality
                            alert('Edit functionality coming soon!')
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Lead Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Lead</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  addLead()
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newLead.name}
                        onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={newLead.email}
                        onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        value={newLead.company}
                        onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Source</label>
                      <select
                        value={newLead.source}
                        onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="manual">Manual Entry</option>
                        <option value="website">Website</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="referral">Referral</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Adding...' : 'Add Lead'}
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
