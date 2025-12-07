module.exports = {
  apps: [
    {
      name: 'polysmart-backend',
      script: 'bin/www',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 443
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 443
      }
    }
  ]
}; 