// PM2 Ecosystem — MyShape Protocol background services
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "myshape-feedback-monitor",
      script: "daemon.cjs",
      cwd: "./scripts/feedback-monitor",
      env: {
        HTTPS_PROXY: "http://127.0.0.1:15236",
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || "",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 30000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/feedback-monitor-error.log",
      out_file: "./logs/feedback-monitor-out.log",
      merge_logs: true,
    },
    {
      name: "myshape-reddit-monitor",
      script: "daemon.cjs",
      cwd: "./scripts/reddit-monitor",
      env: {
        HTTPS_PROXY: "http://127.0.0.1:15236",
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || "",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 30000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/reddit-monitor-error.log",
      out_file: "./logs/reddit-monitor-out.log",
      merge_logs: true,
    },
  ],
};
