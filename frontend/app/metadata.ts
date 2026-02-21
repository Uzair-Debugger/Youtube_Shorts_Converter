import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Shorts AI - Transform Videos into Viral Shorts',
  description:
    'Create engaging YouTube Shorts automatically with AI-powered analysis. Convert any video into mobile-optimized vertical format in minutes. Fast, free, and intelligent.',
  keywords: [
    'YouTube Shorts',
    'AI video editor',
    'video to shorts',
    'vertical video',
    'short form content',
    'video converter',
    'AI video analysis',
    'mobile video',
    'social media content',
  ],
  authors: [{ name: 'YouTube Shorts AI' }],
  creator: 'YouTube Shorts AI',
  publisher: 'YouTube Shorts AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourdomain.com',
    siteName: 'YouTube Shorts AI',
    title: 'YouTube Shorts AI - Transform Videos into Viral Shorts',
    description:
      'Create engaging YouTube Shorts automatically with AI-powered analysis. Convert any video into mobile-optimized vertical format.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'YouTube Shorts AI - AI-Powered Video Conversion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Shorts AI - Transform Videos into Viral Shorts',
    description:
      'Create engaging YouTube Shorts automatically with AI-powered analysis.',
    images: ['/twitter-image.jpg'],
    creator: '@yourtwitterhandle',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://yourdomain.com',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

// ✅ Move viewport & themeColor here
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};
