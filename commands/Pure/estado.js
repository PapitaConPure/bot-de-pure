const { EmbedBuilder, CommandInteraction, Message, StringSelectMenuBuilder, ChatInputCommandInteraction, Colors } = require('discord.js'); //Integrar discord.js
const globalConfigs = require('../../localdata/config.json'); //Variables globales
const { bot_status } = globalConfigs;
const { readdirSync } = require('fs'); //Para el contador de comandos
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { Stats } = require('../../localdata/models/stats');
const { improveNumber, isShortenedNumberString, compressId } = require('../../func');
const { CommandTags, CommandManager } = require('../Commons/commands');
const { makeStringSelectMenuRowBuilder } = require('../../tsCasts');
const { injectWikiPage, searchCommand } = require('../../wiki');
const { Translator } = require('../../internationalization');

const { host, version, note, changelog, todo: toDo } = bot_status;
const COMMAND_REGEX = new RegExp(`(${p_pure().raw})([a-záéíóúñ0-9_.-]+)`, 'gi');

/**
 * @param {string} str 
 * @param {import('../Commons/typings').ComplexCommandRequest} request
 */
function listFormat(str, request) {
    return str.replace(COMMAND_REGEX, `\`${p_pure(request).raw}$2\``);
};
/**@param {number} number*/
function counterDisplay(number) {
    const numberString = improveNumber(number, true);
    if(isShortenedNumberString(numberString))
        return `${numberString} de`;
    return numberString;
}

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('estado', flags)
    .setAliases('status', 'botstatus')
    .setLongDescription('Muestra mi estado actual. Eso incluye versión, host, registro de cambios, cosas por hacer, etc')
    .setExecution(async request => {
        const translator = await Translator.from(request.member);
        const stats = (!globalConfigs.noDataBase && await Stats.findOne({})) || new Stats({ since: Date.now( )});
        const formattedChangelog = changelog.map(item => `- ${item}`).join('\n');
        const formattedToDo = toDo.map(item => `- ${item}`).join('\n');
        const matchedCommands = changelog.join().matchAll(COMMAND_REGEX);
        const counts = {
            commands: readdirSync('./commands/Pure').filter(file => file.endsWith('.js')).length,
            guilds: request.client.guilds.cache.size
        }
        const totalCommands = stats.commands.succeeded + stats.commands.failed;

        const embed = new EmbedBuilder()
            .setColor(0x608bf3)
            .setAuthor({ name: 'Estado del Bot', iconURL: request.client.user.avatarURL({ extension: 'png', size: 1024 }) })
            .setThumbnail('https://i.imgur.com/HxTxjdL.png')
            .setFooter({ text: `Ofreciendo un total de ${counts.commands} comandos en ${counts.guilds} servidores` })
            .addFields(
                { name: 'Creador', value: `Papita con Puré\n[423129757954211880]`, inline: true },
                { name: 'Host', value: (host === 'https://localhost/') ? 'https://heroku.com/' : 'localhost', inline: true },
                { name: 'Versión', value: `#️⃣ ${version.number}\n📜 ${version.name}`, inline: true },
                { name: 'Visión general', value: note },
                { name: 'Cambios', value: listFormat(formattedChangelog, request) },
                { name: 'Lo que sigue', value: listFormat(formattedToDo, request) },
                {
                    name: 'Estadísticas',
                    value: [
                        `🎦 ${counterDisplay(stats.read)} mensajes registrados`,
                        `⚙️ ${counterDisplay(totalCommands)} comandos procesados`,
                        `✅ ${counterDisplay(stats.commands.succeeded)} (${(stats.commands.succeeded / totalCommands * 100).toFixed(2)}%) ejecuciones de comando exitosas`,
                        `⚠️️ ${counterDisplay(stats.commands.failed)} (${(stats.commands.failed / totalCommands * 100).toFixed(2)}%) ejecuciones de comando fallidas`,
                    ].join('\n'),
                },
            );

        const embeds = [embed];
        const components = [];
        if(matchedCommands != null) {
            /**@type {Array<import('discord.js').SelectMenuComponentOptionData | import('discord.js').APISelectMenuOption>}*/
            const commandOptions = [];
            for(const matchedCommand of matchedCommands) {
                const commandName = matchedCommand[2];
                commandOptions.push({
                    label: `${p_pure(request).raw}${commandName}`,
                    value: commandName,
                });
            }

            components.push(makeStringSelectMenuRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`estado_getHelp_${compressId(request.userId)}`)
                    .setPlaceholder('Comandos mencionados...')
                    .addOptions(commandOptions),
            ));
        }

        return request.reply({ embeds, components });
    })
    .setSelectMenuResponse(async function getHelp(interaction) {
        const embeds = [];
        const components = [];

        const query = interaction.values[0];
        const foundCommand = searchCommand(interaction, query);
        if(foundCommand) {
            injectWikiPage(foundCommand, interaction.guildId, { embeds, components });
        } else {
            const translator = await Translator.from(interaction.member);
            embeds.push(
                new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle(translator.getText('somethingWentWrong')),
            );
        }

        return interaction.reply({
            embeds,
            components,
            ephemeral: true,
        });
    }, { userFilterIndex: 0 });

module.exports = command;
