module.exports = {
  reactStrictMode: true,
  // Disable automatic static optimization for pages that need session
  // This helps prevent unnecessary requests during build/SSR
  experimental: {
    // Reduce unnecessary prefetching that could trigger session checks
    optimizeCss: false,
  },
  // Add headers to help with rate limiting and caching
  async headers() {
    return [
      {
        source: '/api/auth/session',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Rate-Limit-Enabled',
            value: 'true',
          },
        ],
      },
    ];
  },
}
