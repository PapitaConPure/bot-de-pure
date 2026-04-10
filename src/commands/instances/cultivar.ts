import { addDays, getUnixTime, isBefore } from 'date-fns';
import { EmbedBuilder } from 'discord.js';
import { tenshiColor } from '@/data/globalProps';
import { improveNumber, randRange } from '@/func';
import { Translator } from '@/i18n';
import UserConfigs from '@/models/userconfigs';
import { Command, CommandTags } from '../commons';

const tags = new CommandTags().add('COMMON');

const command = new Command('cultivar', tags)
	.setAliases('cosechar', 'cosecha', 'recolectar', 'cultivate', 'farm', 'cv', 'c')
	.setBriefDescription('Permite cultivar entre 54 y 66 PRC diario')
	.setDescription(
		'Permite cultivar <:prc:1097208828946301123> 54~66.',
		'Solo se puede hacer una vez por día.',
	)
	.setExecution(async (request) => {
		const userQuery = { userId: request.userId };
		const userConfigs = (await UserConfigs.findOne(userQuery)) || new UserConfigs(userQuery);
		const translator = await Translator.from(request.userId);

		const now = new Date(Date.now());
		const lastCultivationDate = new Date(userConfigs.lastCultivate);
		const nextCultivationDate = addDays(lastCultivationDate, 1);

		if (isBefore(now, nextCultivationDate))
			return request.reply({
				content: translator.getText(
					'cultivarUnauthorized',
					getUnixTime(nextCultivationDate),
				),
			});

		userConfigs.lastCultivate = +now;

		const reward = 60 + randRange(-6, 6, false);
		userConfigs.prc += reward;

		const embed = new EmbedBuilder()
			.setColor(tenshiColor)
			.setAuthor({
				name: request.member.displayName,
				iconURL: request.member.displayAvatarURL({ size: 256 }),
			})
			.setTitle(translator.getText('cultivarTitle'))
			.setDescription(
				translator.getText(
					'cultivarDescription',
					improveNumber(userConfigs.prc, { shorten: true }),
				),
			);

		await userConfigs.save();

		return request.reply({ embeds: [embed] });
	});

export default command;
