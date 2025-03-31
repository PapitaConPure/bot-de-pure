const Discord = require('discord.js');
const UserConfigs = require('../localdata/models/userconfigs.js');

const Logger = require('../logs');
const { warn } = Logger('WARN', 'onReactionAdd');

/**
 * 
 * @param {Discord.MessageReaction | Discord.PartialMessageReaction} reaction 
 * @param {Discord.User | Discord.PartialUser} user 
 * @param {Discord.MessageReactionEventDetails} details 
 * @returns 
 */
async function onReactionAdd(reaction, user, details) {
	let message;
	try {
		/**@type {Discord.Message}*/
		[ reaction, message, user ] = await Promise.all([
			reaction.partial === true ? reaction.fetch() : reaction,
			reaction.message.partial === true ? reaction.message.fetch(true) : reaction.message,
			user.partial === true ? user.fetch() : user,
		]);
	} catch {
		warn('No se puede recuperar información necesaria de una reacción');
		return;
	}

	if(message.author.bot || user.bot) return;

	const { guild } = message;
	const userId = message.author.id;
	
	if(guild.memberCount < 100) return;
	if(user.id === userId) return;

	const userConfigs = (await UserConfigs.findOne({ userId })) || new UserConfigs({ userId });

	const then = userConfigs.lastDateReceived;
	const now = new Date(Date.now());
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	if(+then < +today) {
		userConfigs.reactionsReceivedToday = 0;
		userConfigs.highlightedToday = false;
		userConfigs.messagesToday = 0;
		userConfigs.lastDateReceived = now;
	}

	if(+message.createdAt < +today) return;

	userConfigs.reactionsReceivedToday++;
	if(userConfigs.reactionsReceivedToday <= 10) {
		userConfigs.prc += 10 - ((userConfigs.reactionsReceivedToday - 1) / 3) ** 2;
	}
	
	if(!userConfigs.highlightedToday && reaction.count >= 5) {
		userConfigs.highlightedToday = true;
		userConfigs.prc += 40;
	}
	
	return userConfigs.save();
}

module.exports = {
	onReactionAdd,
};
