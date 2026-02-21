export function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'YouTube Shorts AI',
        url: 'https://yourdomain.com',
        description: 'AI-powered tool to transform YouTube videos into engaging shorts',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'AI-powered video analysis',
          'Automatic short video creation',
          'Vertical format optimization',
          'Fast processing',
        ],
      },
      {
        '@type': 'Organization',
        name: 'YouTube Shorts AI',
        url: 'https://yourdomain.com',
        logo: 'https://yourdomain.com/logo.png',
        sameAs: [
          'https://twitter.com/yourhandle',
          'https://www.facebook.com/yourpage',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://yourdomain.com/#website',
        url: 'https://yourdomain.com',
        name: 'YouTube Shorts AI',
        publisher: {
          '@id': 'https://yourdomain.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://yourdomain.com/?s={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://yourdomain.com',
          },
        ],
      },
    ],
  };
}

// Component to inject structured data
export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateStructuredData()),
      }}
    />
  );
}