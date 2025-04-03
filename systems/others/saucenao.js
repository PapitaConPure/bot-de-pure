const ___ = require('sagiri');
const sagiri = ___.default ? ___.default : /**@type {null}*/(___);
const globalConfigs = require('../../localdata/config.json');
//const { Translator } = require("../../internationalization");
const { EmbedBuilder, Colors } = require("discord.js");
const { decryptString } = require('../../security');
const { Booru } = require('../booru/boorufetch');
const { auditError } = require('./auditor');
const { Translator } = require('../../internationalization');
const { isNSFWChannel } = require('../../func');

const MATCH_COUNT_MAX = 3;
const MATCH_THRESHOLD_PERCENT = 60;

/**@param {string} token*/
function testSauceNAOToken(token) {
	try {
		sagiri(token);
		return true;
	} catch {
		return false;
	}
}

/**
 * Based on the supplied queries, injects corresponding SauceNAO result embeds into the specified payload
 * @param {string} clientId
 * @param {Array<string>} queries
 * @param {import('../../commands/Commons/typings').AnyRequest} request
 * @param {{ successes: Array<EmbedBuilder>, failures: Array<EmbedBuilder> }} payload
 */
async function pourSauce(clientId, queries, request, payload) {
	const translator = await Translator.from(request.user.id);
	const allowNSFW = isNSFWChannel(request.channel);
	const { successes, failures } = payload;

	const token = decryptString(clientId);
	let findSauce;
	try {
		findSauce = sagiri(token, {
			results: MATCH_COUNT_MAX,
			getRatings: true,
			mask: [25], //Gelbooru
		});
	} catch {
		const embed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle(translator.getText('saucenaoInvalidToken'));

		failures.push(embed);
		return;
	}

	const booru = new Booru(globalConfigs.booruCredentials);
	for(let q = 0; q < queries.length; q++) {
		const query = queries[q];
		const count = q + 1;
		
		try {
			const results = (await findSauce(query))
				.filter(result => result.similarity > MATCH_THRESHOLD_PERCENT)
				.sort((a, b) => b.similarity - a.similarity)
				.slice(0, MATCH_COUNT_MAX);

			if(results.length === 0) {
				successes.push(new EmbedBuilder()
					.setColor(Colors.Greyple)
					.setTitle(translator.getText('saucenaoSearchNoResult', count))
					.setThumbnail(query));
				continue;
			}

			await Promise.all(results.map(async result => {
				try {
					const post = await booru.fetchPostByUrl(result.url);
					const isNSFW = post.rating === 'questionable' || post.rating === 'explicit';

					const embed = new EmbedBuilder()
						.setFooter({ text: `${result.similarity}%` });
					
					if(isNSFW && !allowNSFW) {
						embed
							.setColor(Colors.LuminousVividPink)
							.setTitle(translator.getText('saucenaoSearchRedactedTitle', count))
							.setDescription(translator.getText('saucenaoSearchRedactedDesc'))
							.setThumbnail('https://i.imgur.com/P7UWZDo.png');
					} else {
						const sources = post.findUrlSources();
						const sourcesText = `${result.url}\n${sources.join('\n')}`;
						
						embed
							.setColor(Colors.Green)
							.setAuthor({
								name: result.authorName,
								url: result.authorUrl,
							})
							.setTitle(translator.getText('saucenaoSearchSuccess', count))
							.setDescription(sourcesText)
							.setURL(result.url)
							.setThumbnail(post.previewUrl || post.sampleUrl || result.thumbnail);
					}

					successes.push(embed);
				} catch(err) {
					console.error(err);
					successes.push(new EmbedBuilder()
						.setColor(Colors.Orange)
						.setAuthor({
							name: result.authorName,
							url: result.authorUrl,
						})
						.setTitle(translator.getText('saucenaoSearchErrorTitle', count))
						.setDescription(result.url)
						.setURL(result.url)
						.setThumbnail(result.thumbnail)
						.setFooter({ text: `${result.similarity}%` }));
				}
			}));
		} catch(err) {
			console.error(err);
			auditError(err, { brief: 'Ocurrió un problema al buscar una fuente en SauceNAO' });
			failures.push(new EmbedBuilder()
				.setTitle(translator.getText('imgurUploadErrorTitle', count))
				.setColor(Colors.Red)
				.addFields({
					name: err.name || 'Error',
					value: `\`\`\`\n${err.message || err}\n\`\`\``,
				}));
		}
	}
}

module.exports = {
	testSauceNAOToken,
	pourSauce,
};
