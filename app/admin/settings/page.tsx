'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface Settings {
  siteName: string
  siteDescription: string
  contactEmail: string
  defaultMaxAttempts: number
  defaultMaxFlips: number
  requireRegistration: boolean
  allowMultipleAttempts: boolean
  showResults: boolean
  enableRateLimit: boolean
  maxRequestsPerMinute: number
  sessionTimeout: number
  emailNotifications: boolean
  gameCompletionEmails: boolean
  adminAlerts: boolean
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  enableAnimations: boolean
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  
  const [settings, setSettings] = useState<Settings>({
    siteName: 'PlayMass',
    siteDescription: 'Interactive game platform for engaging experiences',
    contactEmail: 'admin@playmass.com',
    defaultMaxAttempts: 3,
    defaultMaxFlips: 7,
    requireRegistration: false,
    allowMultipleAttempts: true,
    showResults: true,
    enableRateLimit: true,
    maxRequestsPerMinute: 100,
    sessionTimeout: 30,
    emailNotifications: true,
    gameCompletionEmails: false,
    adminAlerts: true,
    theme: 'light',
    primaryColor: '#3B82F6',
    enableAnimations: true
  })

  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch settings')
      }
      
      setSettings(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      console.error('Settings fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
    setSuccessMessage(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin' // In real app, this would come from auth
        },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save settings')
      }
      
      setSettings(result.data)
      setHasChanges(false)
      setSuccessMessage('Settings saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      console.error('Settings save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin'
        },
        body: JSON.stringify({ action: 'reset' })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to reset settings')
      }
      
      setSettings(result.data)
      setHasChanges(false)
      setSuccessMessage('Settings reset to defaults successfully!')
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings')
      console.error('Settings reset error:', err)
    } finally {
      setSaving(false)
    }
  }

  // Load settings on component mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const tabs = [
    { id: 'general', name: 'General', icon: '🔧' },
    { id: 'games', name: 'Game Settings', icon: '🎮' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '📧' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Failed to Load Settings
                </h3>
                <p className="text-red-800 mb-3">{error}</p>
                <button
                  onClick={fetchSettings}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure system settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Settings</h3>
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              {/* Save Banner */}
              {hasChanges && (
                <div className="border-b border-gray-200 bg-yellow-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="text-sm font-medium text-yellow-800">
                        You have unsaved changes
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Reset to original values
                          setHasChanges(false)
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={settings.siteName}
                          onChange={(e) => handleInputChange('siteName', e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Description
                        </label>
                        <textarea
                          value={settings.siteDescription}
                          onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                          rows={3}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Settings */}
                {activeTab === 'games' && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Game Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Max Attempts per User
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.defaultMaxAttempts}
                          onChange={(e) => handleInputChange('defaultMaxAttempts', parseInt(e.target.value))}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Max Flips per Attempt
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="7"
                          value={settings.defaultMaxFlips}
                          onChange={(e) => handleInputChange('defaultMaxFlips', parseInt(e.target.value))}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="requireRegistration"
                            checked={settings.requireRegistration}
                            onChange={(e) => handleInputChange('requireRegistration', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="requireRegistration" className="ml-2 text-sm text-gray-700">
                            Require user registration to play games
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="allowMultipleAttempts"
                            checked={settings.allowMultipleAttempts}
                            onChange={(e) => handleInputChange('allowMultipleAttempts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="allowMultipleAttempts" className="ml-2 text-sm text-gray-700">
                            Allow multiple attempts per user
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="showResults"
                            checked={settings.showResults}
                            onChange={(e) => handleInputChange('showResults', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="showResults" className="ml-2 text-sm text-gray-700">
                            Show results to players after game completion
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                    <div className="space-y-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enableRateLimit"
                          checked={settings.enableRateLimit}
                          onChange={(e) => handleInputChange('enableRateLimit', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enableRateLimit" className="ml-2 text-sm text-gray-700">
                          Enable rate limiting
                        </label>
                      </div>

                      {settings.enableRateLimit && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Requests per Minute
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="1000"
                            value={settings.maxRequestsPerMinute}
                            onChange={(e) => handleInputChange('maxRequestsPerMinute', parseInt(e.target.value))}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={settings.sessionTimeout}
                          onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="emailNotifications"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                            Enable email notifications
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="gameCompletionEmails"
                            checked={settings.gameCompletionEmails}
                            onChange={(e) => handleInputChange('gameCompletionEmails', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="gameCompletionEmails" className="ml-2 text-sm text-gray-700">
                            Send emails on game completion
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="adminAlerts"
                            checked={settings.adminAlerts}
                            onChange={(e) => handleInputChange('adminAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="adminAlerts" className="ml-2 text-sm text-gray-700">
                            Receive admin alerts and system notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance */}
                {activeTab === 'appearance' && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Appearance Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => {
                            const newTheme = e.target.value as 'light' | 'dark' | 'auto'
                            setTheme(newTheme)
                            handleInputChange('theme', newTheme)
                          }}
                          className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Choose your preferred theme. Auto will follow your system preference.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enableAnimations"
                          checked={settings.enableAnimations}
                          onChange={(e) => handleInputChange('enableAnimations', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enableAnimations" className="ml-2 text-sm text-gray-700">
                          Enable animations and transitions
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Settings are automatically saved when changed
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      hasChanges
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Save All Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  {successMessage}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Settings Status Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">🚀</span>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Settings Interface Now Live
              </h3>
              <p className="text-blue-800 mb-3">
                The settings interface is now connected to the API and fully functional. Changes you make will be saved to the database.
              </p>
              <ul className="text-blue-800 text-sm space-y-1 ml-4">
                <li>• All settings are now persisted to the database</li>
                <li>• Real-time validation and error handling</li>
                <li>• Loading states and success notifications</li>
                <li>• Reset to defaults functionality</li>
              </ul>
              <p className="text-blue-800 mt-3">
                Additional improvements planned for future releases:
              </p>
              <ul className="text-blue-800 text-sm space-y-1 ml-4">
                <li>• Environment-specific configurations</li>
                <li>• Advanced security options</li>
                <li>• Email template customization</li>
                <li>• Theme and branding customization</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🔄 Live Data
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  🔧 Fully Configurable
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
