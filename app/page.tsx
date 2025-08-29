import Link from 'next/link';
import SystemStatus from './components/SystemStatus';

/**
 * Home Page - Landing page for PlayMass
 * 
 * Provides an overview of the platform and navigation to key features.
 * Includes system status monitoring and quick access to admin tools.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PlayMass</h1>
                <p className="text-sm text-gray-600">Interactive Game Platform</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-6">
              <Link 
                href="/admin" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Game
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Create Engaging Interactive Games
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Build and distribute Stars Hexa games to your target audience with comprehensive 
            rewards management, participant tracking, and detailed analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/admin" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium text-lg"
            >
              🎮 Start Creating Games
            </Link>
            
            <Link 
              href="/api/health" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-lg"
            >
              📊 View System Status
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🎡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Stars Hexa Games</h3>
            <p className="text-gray-600">
              Create interactive hexagonal star-finding games with customizable text,
              hidden stars, and reward configurations.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Rewards Management</h3>
            <p className="text-gray-600">
              Manage points, coupons, physical prizes, and custom rewards with 
              comprehensive tracking and validation.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Participant Tracking</h3>
            <p className="text-gray-600">
              Track participants across multiple games and sessions with 
              detailed engagement analytics.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
            <p className="text-gray-600">
              Get detailed insights on game performance, reward distribution, 
              and participant engagement patterns.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Anti-cheat Protection</h3>
            <p className="text-gray-600">
              Built-in security measures including session tracking, 
              IP monitoring, and fraud detection.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Target Groups</h3>
            <p className="text-gray-600">
              Organize participants into groups for targeted campaigns 
              and personalized gaming experiences.
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <span>🔧</span>
            <span>System Status</span>
          </h3>
          <SystemStatus />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🎯</span>
                <span className="text-xl font-bold">PlayMass</span>
              </div>
              <p className="text-gray-400">
                Interactive game platform for creating and distributing 
                engaging games with comprehensive rewards management.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Stars Hexa Games</li>
                <li>Rewards Management</li>
                <li>Participant Tracking</li>
                <li>Analytics & Insights</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Technical</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Next.js 15.5.2</li>
                <li>MongoDB Atlas</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 PlayMass. Built with ❤️ for interactive gaming experiences.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
