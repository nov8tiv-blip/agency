module.exports = {
  apps: [
    {
      name: "crm-api",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        AWS_REGION: process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        S3_BUCKET: process.env.S3_BUCKET,
        SES_FROM_EMAIL: process.env.SES_FROM_EMAIL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      },
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "800M",
    },
  ],
};
