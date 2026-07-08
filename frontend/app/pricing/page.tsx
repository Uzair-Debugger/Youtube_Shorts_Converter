'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { subscriptionApi } from '../../lib/subscription';

const PLANS = [
  {
    key: 'FREE' as const,
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['3 shorts / month', '720p output', 'Community support'],
    cta: 'Current plan',
    disabled: true,
  },
  {
    key: 'PRO' as const,
    name: 'Pro',
    price: '$12',
    period: 'per month',
    features: ['50 shorts / month', '1080p output', 'Priority processing', 'Email support'],
    cta: 'Upgrade to Pro',
    disabled: false,
    highlight: true,
  },
  {
    key: 'BUSINESS' as const,
    name: 'Business',
    price: '$39',
    period: 'per month',
    features: ['Unlimited shorts', '4K output', 'Dedicated processing', 'Slack support', 'Team seats'],
    cta: 'Upgrade to Business',
    disabled: false,
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (plan: 'PRO' | 'BUSINESS') => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setLoading(plan);
    setError(null);
    try {
      await subscriptionApi.checkout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-purple-600 mb-2">Simple pricing</h1>
        <p className="text-center text-gray-500 mb-12">Start free. Upgrade when you need more.</p>

        {error && (
          <div role="alert" className="mb-8 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.highlight
                  ? 'border-purple-500 shadow-xl ring-2 ring-purple-500'
                  : 'border-gray-200 shadow-md'
              }`}
            >
              {plan.highlight && (
                <span className="self-start text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              <div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="text-3xl font-extrabold mt-1">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-500 ml-1">{plan.period}</span>
                </p>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-gray-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={plan.disabled || loading === plan.key}
                onClick={() => !plan.disabled && handleSelect(plan.key as 'PRO' | 'BUSINESS')}
                className={`w-full py-3 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  plan.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.highlight
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-700 text-white'
                }`}
              >
                {loading === plan.key ? 'Redirecting…' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
