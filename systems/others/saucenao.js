const ___ = require('sagiri');
const sagiri = ___.default ? ___.default : /**@type {null}*/(___);
const globalConfigs = require('../../localdata/config.json');
const { Translator } = require("../../internationalization");
const { EmbedBuilder, Colors } = require("discord.js");
const { decryptString } = require('../../security');
const { Booru } = require('../booru/boorufetch');
const { auditError } = require('./auditor');

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
 * @param {Translator} translator
 * @param {{ successes: Array<EmbedBuilder>, failures: Array<EmbedBuilder> }} payload
 */
async function injectSauceNAOEmbeds(clientId, queries, translator, payload) {
	const { successes, failures } = payload;

	const token = decryptString(clientId);
	let findSauce;
	try {
		findSauce = sagiri(token, {
			results: 3,
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
	let count = 1;
	for(const query of queries) {
		try {
			const results = (await findSauce(query))
				.filter(result => result.similarity > 50);

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
					const sources = post.findUrlSources();
					const sourcesText = `${result.url}\n${sources.join('\n')}`;

					successes.push(new EmbedBuilder()
						.setColor(Colors.Green)
						.setAuthor({
							name: result.authorName,
							url: result.authorUrl,
						})
						.setTitle(translator.getText('saucenaoSearchSuccess', count))
						.setDescription(sourcesText)
						.setURL(result.url)
						.setThumbnail(post.previewUrl || post.sampleUrl || result.thumbnail)
						.setFooter({ text: `${result.similarity}%` }));
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

		count++;
	}
}

module.exports = {
	testSauceNAOToken,
	injectSauceNAOEmbeds,
};
