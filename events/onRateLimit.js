const chalk = require('chalk');

/**@param {import('discord.js').RateLimitData} rateLimit*/
function onRateLimit(rateLimit) {
    console.log(
        chalk.redBright('RateLimit'),
        chalk.yellowBright(`(${rateLimit.timeToReset}ms / global ${rateLimit.global}):`),
        chalk.bgCyanBright.black.bold(`${rateLimit.method} →`), chalk.greenBright(rateLimit.route),
    );
}

module.exports = {
    onRateLimit,
};