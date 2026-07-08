'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscriptionApi, Subscription } from '../../lib/subscription';

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subscriptionApi.getStatus()
      .then(({ subscription }) => setSub(subscription))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      await subscriptionApi.portal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const planBadgeColor: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-600',
    PRO: 'bg-purple-100 text-purple-700',
    BUSINESS: 'bg-yellow-100 text-yellow-700',
  };

  const statusBadgeColor: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    TRIALING: 'bg-blue-100 text-blue-700',
    CANCELED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 py-16 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-8">Billing & Subscription</h1>

        {error && (
          <div role="alert" className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <div className="rounded-2xl border border-gray-200 shadow-md p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Current plan</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${planBadgeColor[sub?.plan ?? 'FREE']}`}>
                {sub?.plan ?? 'FREE'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusBadgeColor[sub?.status ?? 'ACTIVE']}`}>
                {sub?.status ?? 'ACTIVE'}
              </span>
            </div>

            {sub?.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">
                  {sub.cancelAtPeriodEnd ? 'Access until' : 'Renews on'}
                </span>
                <span className="text-sm font-medium">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}

            {sub?.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Your subscription is set to cancel at the end of the current period.
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {sub?.stripeSubscriptionId ? (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  {portalLoading ? 'Opening portal…' : 'Manage subscription'}
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="block text-center w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                >
                  Upgrade plan
                </Link>
              )}
              <Link
                href="/dashboard"
                className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
