module.exports = {
  apps: [
    {
      name: "filemint",
      script: "npm",
      args: "start",
      cwd: "/home/your_username/public_html/filemint",
      env: {
        NODE_ENV: "development",
        PORT: 3000
      },
      error_file: "/var/log/filemint_error.log",
      output_file: "/var/log/filemint_out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 4000,
      max_memory_restart: "1G",
      autorestart: true,
      watch: false,
      instances: 1,
      exec_mode: "fork"
    }
  ]
};
