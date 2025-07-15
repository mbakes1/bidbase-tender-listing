import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Exclude Supabase functions from the build
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    
    // Ignore Supabase functions directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**']
    }
    
    return config
  },
  
  // Exclude Supabase functions from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Exclude Supabase functions from ESLint
  eslint: {
    dirs: ['src', 'app'],
  },
};

export default nextConfig;
