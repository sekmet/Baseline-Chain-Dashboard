module.exports = {
  apps : [{
    name: 'commit-mgr',
    script: 'dist/index.js',
    watch: ["."],
    // Delay between restart
    watch_delay: 1000,
    ignore_watch : ["node_modules", "logs/*", "out/baseline-commit-mgr-tests-report.html", "public/baseline-commit-mgr-tests-report.html"],
  }/*, {
    name: 'ui-dashboard'
    script: 'serve out/ -p 3000',
  }*/],

  /*deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }*/
};
