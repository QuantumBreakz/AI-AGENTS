'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CommandLineIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin'

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon, description: 'Overview & Analytics' },
  { 
    name: 'Agent-2', 
    href: '#', 
    icon: RocketLaunchIcon, 
    description: 'Lead Generation & Email',
    children: [
      { name: 'Leads', href: `/${ADMIN_PATH}/leads`, icon: UserGroupIcon },
      { name: 'Campaigns', href: `/${ADMIN_PATH}/campaigns`, icon: EnvelopeIcon },
      { name: 'Analytics', href: `/${ADMIN_PATH}/analytics`, icon: ChartBarIcon },
      { name: 'Scoring', href: `/${ADMIN_PATH}/scoring`, icon: CpuChipIcon },
      { name: 'Jobs', href: `/${ADMIN_PATH}/jobs`, icon: CommandLineIcon },
      { name: 'Orchestrate', href: `/${ADMIN_PATH}/orchestrate`, icon: SparklesIcon },
    ]
  },
  { 
    name: 'Agent-3', 
    href: '#', 
    icon: PhoneIcon, 
    description: 'AI Calling & Communication',
    children: [
      { name: 'Calls', href: `/${ADMIN_PATH}/calls`, icon: PhoneIcon },
      { name: 'Business', href: `/${ADMIN_PATH}/business`, icon: BuildingOfficeIcon },
      { name: 'Inbound', href: `/${ADMIN_PATH}/inbound`, icon: BellIcon },
      { name: 'Twilio', href: `/${ADMIN_PATH}/twilio`, icon: CogIcon },
    ]
  },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['Agent-2', 'Agent-3'])

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  const isCurrentPath = (href: string) => pathname === href
  const isChildCurrent = (children: any[]) => children.some(child => pathname === child.href)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">Agents</h1>
                  <p className="text-xs text-gray-500">AI Dashboard</p>
                </div>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleSection(item.name)}
                        className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400" />
                        {item.name}
                        <ChevronDownIcon className={`ml-auto h-4 w-4 transition-transform ${expandedSections.includes(item.name) ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedSections.includes(item.name) && (
                        <div className="ml-6 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`${
                                isCurrentPath(child.href)
                                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                              <child.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${
                        isCurrentPath(item.href)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-white">Agents</h1>
                <p className="text-xs text-blue-100">AI Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 rounded-md text-blue-100 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <BellIcon className="h-5 w-5" />
              </button>
              <button className="p-1 rounded-md text-blue-100 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <CogIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleSection(item.name)}
                        className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isChildCurrent(item.children)
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                        <ChevronDownIcon className={`ml-auto h-4 w-4 transition-transform ${expandedSections.includes(item.name) ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedSections.includes(item.name) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`${
                                isCurrentPath(child.href)
                                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700 shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200`}
                            >
                              <child.icon className="mr-3 flex-shrink-0 h-4 w-4" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${
                        isCurrentPath(item.href)
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200`}
                    >
                      <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <p className="text-xs text-gray-500">admin@agents.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Agent-2: Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Agent-3: Online</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                © 2024 Agents Dashboard. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
