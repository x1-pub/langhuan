module.exports = {
  apps: [
    {
      name: "langhuan_server",
      script: "dist/app.js",
      instances: "max",
      exec_mode: "cluster",
      sticky: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
