import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Exclude Supabase functions from the build
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    
    // Ignore Supabase functions directory and test files
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**', '**/*.test.*', '**/*.spec.*']
    }
    
    // Exclude test files from compilation
    config.module.rules.push({
      test: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
      loader: 'ignore-loader'
    })
    
    return config
  },
  
  // Exclude Supabase functions from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Exclude Supabase functions and test files from ESLint
  eslint: {
    dirs: ['src', 'app'],
    ignoreDuringBuilds: false,
  },
  

};

export default nextConfig;
