export type EnvName = 'LOCAL' | 'DEV' | 'STAGING' | 'PROD';

interface EnvConfig {
  baseURL: string;
  apiURL: string;
}

const configs: Record<EnvName, EnvConfig> = {
  LOCAL: {
    baseURL: 'http://localhost:5173/',
    apiURL: 'http://localhost:8000/api/v1/',
  },
  DEV: {
    baseURL: 'https://dev.contamelo.com.co',
    apiURL: 'https://api-dev.contamelo.com.co/api/v1/',
  },
  STAGING: {
    baseURL: 'https://staging.contamelo.com.co',
    apiURL: 'https://api-staging.contamelo.com.co/api/v1/',
  },
  PROD: {
    baseURL: 'https://app.contamelo.com.co',
    apiURL: 'https://api.contamelo.com.co/api/v1/',
  },
};

export function getEnvConfig(): EnvConfig {
  const env = (process.env.ENVIRONMENT || 'LOCAL').toUpperCase() as EnvName;
  return configs[env] ?? configs.LOCAL;
}
