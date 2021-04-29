module.exports = {
  apps : [{
    name: 'Bot',
    script: 'index.js',
    exp_backoff_restart_delay: 100,

    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:PapitaConPure/bot-de-pure.git',
      path : '/var/www/production',
      'ssh_options': 'StrictHostKeyChecking=no',
      'pre-setup' : 'apt-get install git',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    staging : {
      user : "node",
      host : "212.83.163.1",
      ref  : "origin/master",
      repo : "git@github.com:PapitaConPure/bot-de-pure.git",
      path : "/var/www/development",
      'ssh_options': ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
      'post-deploy' : 'pm2 startOrRestart ecosystem.json --env dev',
      "env"  : {
        "NODE_ENV": "staging"
      }
    }
  }
};
