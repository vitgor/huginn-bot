const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { parse, format } = require('fecha');
const config = require('../config.json');
const mysql = require('mysql');
const database = mysql.createConnection({
	host: config.db_config.host,
	user: config.db_config.dbuser,
	password: config.db_config.dbpass,
	database: config.db_config.dbname,
	debug: false,
	multipleStatements: true,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('listevent')
		.setDescription('Просмотреть список участников последнего созданного События или Квеста.')
		.addStringOption(option =>
			option.setName('event_type')
				.setDescription('Выберите тип события.')
				.setRequired(true)
				.addChoices(
					{ name: 'Событие', value: 'event' },
					{ name: 'Квест', value: 'quest' }
				))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {
		const hasAdminRole = interaction.member.roles.cache.some(r => JSON.stringify(config.admin_roles).includes(r.name))
		if (hasAdminRole == false) {
			const locales = {
				"en-US": 'You do not have permission to execute this command!'
			};
			await interaction.reply(locales[interaction.locale] ?? 'У вас недостаточно прав для выполнения этой команды!');
		}

		const event_type = interaction.options.getString('event_type');

		if (event_type == "event") {
			getLastEvent(function (error, event_data) {
				if (error) {
					const locales = {
						"en-US": 'An error occurred while retrieving event data.'
					};
					interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
				} else {
					getListEventRegistrations(event_data.id, function (error, event_reg_list) {
						if (error) {
							const locales = {
								"en-US": 'An error occurred while retrieving members list.'
							};
							interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
						} else {
							var list_accepted = '';
							var list_declined = '';
							var accepted_count = 0;
							var declined_count = 0;

							for (i = 0; i < event_reg_list.length; i++) {
								end_user = interaction.guild.members.cache.get(event_reg_list[i].user_uid);
								switch (event_reg_list[i].user_status) {
									case '1':
										list_accepted = list_accepted + `${end_user}\r`;
										accepted_count++;
										break;
									case '0':
										list_declined = list_declined + `${end_user}\r`;
										declined_count++;
										break;
									default:
										break;
								}
							}
							if (accepted_count === 0) {
								list_accepted = "*Список пуст*";
							}
							if (declined_count === 0) {
								list_declined = "*Список пуст*";
							}
							const embed_event = {
								title: event_data.event_title,
								color: 0x0099ff,
								fields: [
									{
										name: "Дата проведения",
										value: format(new Date(event_data.event_date), 'DD.MM.YYYY, HH:mm'),
										inline: true
									},
									{
										name: "Место проведения",
										value: event_data.event_location,
										inline: true
									},
									{
										name: "Участвуют в мероприятии:",
										value: list_accepted,
									},
									{
										name: "Не участвуют:",
										value: list_declined,
									},
									{
										name: "\u200b",
										value: "\u200b"
									},
								],
								timestamp: new Date().toISOString(),
								footer: {
									icon_url: config.ui.icon_url,
									text: config.ui.title
								},
							}
							interaction.reply({ content: 'Вот список участников ближайшего мероприятия:', embeds: [embed_event], ephemeral: true });
						}
					});
				}
			});
		} else if (event_type == "quest") {
			getLastQuest(function (error, quest_data) {
				if (error) {
					const locales = {
						en: 'An error occurred while retrieving quest data.'
					};
					interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
				} else {
					getListQuestRegistrations(quest_data.id, function (error, quest_reg_list) {
						if (error) {
							const locales = {
								en: 'An error occurred while retrieving members list.'
							};
							interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
						} else {

							var list_accepted = '';
							var accepted_count = 0;

							for (i = 0; i < quest_reg_list.length; i++) {
								end_user = interaction.guild.members.cache.get(quest_reg_list[i].user_uid);
								list_accepted = list_accepted + `${end_user}\r`;
								accepted_count++;
							}

							if (accepted_count === 0) {
								list_accepted = "*Список пуст*";
							}

							const embed_quest = {
								title: quest_data.quest_title,
								color: 0x0099ff,
								fields: [
									{
										name: "Дата завершения",
										value: format(new Date(quest_data.quest_date), 'DD.MM.YYYY, HH:mm'),
									},
									{
										name: "Взяли задание:",
										value: list_accepted,
									},
									{
										name: "\u200b",
										value: "\u200b"
									},
								],
								timestamp: new Date().toISOString(),
								footer: {
									icon_url: config.ui.icon_url,
									text: config.ui.title
								},
							}
							interaction.reply({ content: 'Вот список участников последнего активного квеста:', embeds: [embed_quest], ephemeral: true });
						}
					});
				}
			});
		}
	}

};

getLastEvent = function (callback) {
	// Prepare MySQL request check if there is opened-registration event	
	let sql1 = "SELECT * FROM `events` ORDER BY `date_created` DESC LIMIT 1; ";
	database.query(sql1, (error1, result, fields) => {
		if (error1) {
			callback("Ошибка в работе базы данных (getLastEvent).", null);
			return;
		} else if (result.length != 1) {
			callback("Событие отсуствует в базе данных.", null);
			return;
		} else {
			callback(null, result[0]);
		}
	});
	// getLastEvent closed
}

getListEventRegistrations = function (event_id, callback) {
	// Prepare MySQL request to get list of registred users	
	let sql2 = "SELECT `events_usr`.`user_uid`, `events_usr`.`user_status` FROM `events_usr` INNER JOIN (SELECT MAX(id) as id FROM `events_usr` GROUP BY `user_uid` ) last_updates ON last_updates.id = events_usr.id WHERE events_usr.event_id = ? ORDER BY `user_status` DESC;";
	database.query(sql2, [event_id], (error2, result, fields) => {
		if (error2) {
			callback("Ошибка в работе базы данных (getListEventRegistrations).", null);
			return;
		} else if (result.length == 0) {
			callback("Отсуствуют регистрации на мероприятия.", null);
			return;
		} else {
			callback(null, result);
		}
	});
}

getLastQuest = function (callback) {
	// Prepare MySQL request check if there is opened-registration event	
	let sql3 = "SELECT * FROM `quests` ORDER BY `date_created` DESC LIMIT 1; ";
	database.query(sql3, (error3, result, fields) => {
		if (error3) {
			callback("Ошибка в работе базы данных (getLastQuest).", null);
			return;
		} else if (result.length != 1) {
			callback("Квест отсуствует в базе данных.", null);
			return;
		} else {
			callback(null, result[0]);
		}
	});
	// getLastEvent closed
}

getListQuestRegistrations = function (quest_id, callback) {
	// Prepare MySQL request to get list of registred users	
	let sql4 = "SELECT `quests_usr`.`user_uid`, `quests_usr`.`user_status` FROM `quests_usr` INNER JOIN (SELECT MAX(id) as id FROM `quests_usr` GROUP BY `user_uid`) last_updates ON last_updates.id = quests_usr.id WHERE quests_usr.quest_id = ? AND quests_usr.user_status = '1' ORDER BY `user_status` DESC; ";
	database.query(sql4, [quest_id], (error4, result, fields) => {
		if (error4) {
			callback("Ошибка в работе базы данных (getListQuestRegistrations).", null);
			return;
		} else if (result.length == 0) {
			callback("Отсуствуют регистрации на квест.", null);
			return;
		} else {
			callback(null, result);
		}
	});
}