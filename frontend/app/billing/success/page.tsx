'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscriptionApi, Subscription } from '../../../lib/subscription';

export default function BillingSuccessPage() {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    // Poll once to confirm the webhook has synced the subscription
    const poll = async (attempts = 0) => {
      try {
        const { subscription } = await subscriptionApi.getStatus();
        if (subscription?.plan !== 'FREE' && subscription?.status === 'ACTIVE') {
          setSub(subscription);
        } else if (attempts < 5) {
          setTimeout(() => poll(attempts + 1), 1500);
        } else {
          setSub(subscription);
        }
      } catch {
        // Silently ignore — user can navigate to /billing manually
      }
    };
    poll();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-purple-600">You're all set!</h1>
        <p className="text-gray-600">
          {sub
            ? `Your ${sub.plan} plan is now active.`
            : 'Your subscription is being activated — this takes just a moment.'}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            Go to dashboard
          </Link>
          <Link
            href="/billing"
            className="block text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            View billing details
          </Link>
        </div>
      </div>
    </div>
  );
}
