// src/utils/envCheck.ts
export function checkRequiredEnvVars() {
  const required = ['PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`?? Missing required env vars: ${missing.join(', ')}`);
    return false;
  }
  
  // Optional services - just warn, don't fail
  const optional = [
    'JWT_SECRET',
    'OPENROUTER_API_KEY', 
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET'
  ];
  
  optional.forEach(key => {
    if (!process.env[key]) {
      console.warn(`?? Optional env var ${key} not set - related features may not work`);
    }
  });
  
  return true;
}
