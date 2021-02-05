module.exports = {
  apps : [{
    name: 'commit-mgr',
    script: 'dist/src/index.js',
    watch: ["."],
    // Delay between restart
    watch_delay: 1000,
    ignore_watch : ["dist/node_modules", "dist/logs/*", "dist/out", "dist/public", "did"],
  },{
    name: 'ui-dashboard',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: './',
  },{
    name: 'did-server',
    script: 'did/build/index.js',
    args: 'daf server',
  }],

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
