import chalk from 'chalk';

export function onRateLimit(rateLimit: import('discord.js').RateLimitData) {
	console.log(
		chalk.redBright('RateLimit'),
		chalk.yellowBright(`(${rateLimit.timeToReset}ms / global ${rateLimit.global}):`),
		chalk.bgCyanBright.black.bold(`${rateLimit.method} →`), chalk.greenBright(rateLimit.route),
	);
}
