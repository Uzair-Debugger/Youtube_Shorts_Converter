'use client';

import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-purple-600">YouTube Shorts AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Hello, <span className="font-medium">{user?.name || user?.email}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </header>

        <main>
          <section className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Create Your Short
            </h2>
            <p className="text-gray-600 mb-6">
              Enter a YouTube URL below to transform it into engaging shorts with AI-powered analysis.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Converter form would submit here with authentication.');
              }}
              className="space-y-4"
              noValidate
            >
              <div>
                <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Video URL
                </label>
                <input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
                  required
                  autoComplete="url"
                />
              </div>

              <div>
                <label htmlFor="shorts-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Shorts
                </label>
                <input
                  id="shorts-count"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-24 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                Create Shorts
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
