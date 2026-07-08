import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Subscription {
  id: string;
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'TRIALING';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await authenticatedFetch(`${API_URL}/api/v1/subscription${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await authenticatedFetch(`${API_URL}/api/v1/subscription${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data as T;
}

export const subscriptionApi = {
  /** Start a Stripe Checkout session for the given plan. Redirects the browser. */
  checkout: async (plan: 'PRO' | 'BUSINESS') => {
    const { url } = await post<{ url: string }>('/checkout', { plan });
    window.location.href = url;
  },

  /** Open the Stripe Billing Portal. Redirects the browser. */
  portal: async () => {
    const { url } = await post<{ url: string }>('/portal');
    window.location.href = url;
  },

  /** Fetch the current user's subscription record. */
  getStatus: () => get<{ subscription: Subscription | null }>('/status'),
};
