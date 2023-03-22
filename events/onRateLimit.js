const chalk = require('chalk');

function onRateLimit(rateLimit) {
    console.log(
        chalk.redBright('RateLimit'),
        chalk.yellowBright(`(${rateLimit.timeout}ms / global ${rateLimit.global}):`),
        chalk.bgCyanBright.black.bold(`${rateLimit.method} →`), chalk.greenBright(rateLimit.route),
    );
}

module.exports = {
    onRateLimit,
};