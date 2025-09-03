import type { NextConfig } from "next";

// Configuration objects for different environments
const devConfig = {
  AUTH: String(false),
  AUTH_URL: 'https://auth.azureai.win',
  APP_URL: 'http://localhost:3000',
  BACKEND_URL: 'http://localhost:3010'
};

const liveConfig = {
  AUTH: String(true),
  AUTH_URL: 'https://auth.azureai.win',
  APP_URL: 'https://imagedojo.azureai.win',
  BACKEND_URL: 'https://backend.azureai.win'
};

// Select configuration based on ENVIRONMENT variable
const isLive = process.env.ENVIRONMENT === 'live';
const envConfig = isLive ? liveConfig : devConfig;

const nextConfig: NextConfig = {
  env: {
    ...envConfig,
  }
};

export default nextConfig;