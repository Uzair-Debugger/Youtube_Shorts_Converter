'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-purple-600">
            YouTube Shorts AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Transform any video into viral shorts with AI-powered analysis
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 border border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </header>

        <main>
          <section
            className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-8"
            aria-labelledby="features-heading"
          >
            <h2 id="features-heading" className="sr-only">
              Features
            </h2>

            <article className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-4xl mb-4" role="img" aria-label="AI-Powered">
                🤖
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">AI-Powered</h3>
              <p className="text-gray-600">
                Intelligent analysis finds the most engaging moments automatically
              </p>
            </article>

            <article className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-4xl mb-4" role="img" aria-label="Vertical Format">
                📱
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Vertical Format</h3>
              <p className="text-gray-600">
                Perfect 9:16 aspect ratio optimized for mobile viewing
              </p>
            </article>

            <article className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-4xl mb-4" role="img" aria-label="Fast and Free">
                ⚡
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Fast & Free</h3>
              <p className="text-gray-600">
                Create professional shorts in minutes, completely free
              </p>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
