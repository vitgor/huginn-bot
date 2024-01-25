const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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
		.setName('addevent')
		.setDescription('Создать Событие или Квест для участников сообщества.')
		.addStringOption(option =>
			option.setName('event_type')
			.setDescription('Что создаем?')
			.setRequired(true)
			.addChoices(
				{ name: 'Событие', value: 'event' },
				{ name: 'Квест', value: 'quest' }
			))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {
		const hasAdminRole = interaction.member.roles.cache.some(r=>JSON.stringify(config.admin_roles).includes(r.name))
		if (hasAdminRole == false) {
			const locales = {
				"en-US": 'You do not have permission to execute this command!'
				};
			await interaction.reply(locales[interaction.locale] ?? 'У вас недостаточно прав для выполнения этой команды!');
		}

		const data_event = interaction.options.getString('event_type');

		if (data_event == 'event') {
			checkActiveEventExists(function (error) {
				if (error) {
					const locales = {
						"en-US": 'An error occurred while checking event already exists.'
					};
					interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
				} else {
					var modal_form = {
						"title": "Создать мероприятие",
						"custom_id": "event_run",
						"components": [
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "event_title",
									"label": "Название мероприятия:",
									"style": 1,
									"min_length": 1,
									"max_length": 500,
									"required": true
								}]
							},
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "event_datetime",
									"label": "Дата проведения:",
									"placeholder": "DD/MM/YYYY HH:MM",
									"style": 1,
									"min_length": 1,
									"max_length": 500,
									"required": true
								}]
							},
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "event_location",
									"label": "Место проведения:",
									"style": 1,
									"min_length": 1,
									"max_length": 500,
									"value": "Помещение Клуба (Tamme 17, Jõhvi vald)",
									"required": true							
								}]
							},
							{
								"type": 1,
								"components": [{
								"type": 4,
								"custom_id": "event_description",
								"label": "Краткое описание:",
								"style": 2,
								"min_length": 1,
								"max_length": 2000,
								"required": false
								}]
							},
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "event_url",
									"label": "URL с подробной информацией:",
									"style": 1,
									"min_length": 1,
									"max_length": 1000,
									"required": false
								}]
							},
						]
					}					
					interaction.showModal(modal_form);	
				}				
			});
		} else if (data_event == 'quest') {
			checkActiveQuestExists(function (error) {
                if (error) {
                    const locales = {
                        "en-US": 'An error occurred while checking quest already exists.'
                    };
                    interaction.reply({ content: locales[interaction.locale]?? error, ephemeral: true });
                } else {	
					var modal_form = {
						"title": "Создать квест",
						"custom_id": "quest_run",
						"components": [
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "quest_title",
									"label": "Название квеста:",
									"style": 1,
									"min_length": 1,
									"max_length": 1000,
									"required": true
								}]
							},
							{
								"type": 1,
								"components": [{
								"type": 4,
								"custom_id": "quest_description",
								"label": "Краткое описание задания:",
								"style": 2,
								"min_length": 1,
								"max_length": 2000,
								"required": true
								}]
							},
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "quest_datetime",
									"label": "Срок выполнения:",
									"placeholder": "DD/MM/YYYY HH:MM",
									"style": 1,
									"min_length": 1,
									"max_length": 500,
									"required": true
								}]
							},
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "quest_reward",
									"label": "Награда за выполнение:",
									"style": 2,
									"min_length": 1,
									"max_length": 2000,
									"required": true
								}]
							},
						]
					}
					interaction.showModal(modal_form);	
				}
            });
		}			
	},
};

checkActiveEventExists = function (callback) {
	// Prepare MySQL request check if there is opened-registration event	
	let sql1 = "SELECT * FROM `events` WHERE `event_date` > NOW() LIMIT 1; ";
	database.query(sql1, (error1, result, fields) => {
		if (error1) {
			callback("Ошибка в работе базы данных.");
			return;
		} else if (result.length != 0) {
			callback("Событие с активной регистрацией уже существует.");
			return;
		} else {
			callback(null);
			return;
		}
	});
	// checkEventExists closed
}

checkActiveQuestExists = function (callback) {
	// Prepare MySQL request check if there is opened-registration event	
	let sql2 = "SELECT * FROM `quests` WHERE `quest_date` > NOW() LIMIT 1; ";
	database.query(sql2, (error2, result, fields) => {
		if (error2) {
			callback("Ошибка в работе базы данных.");
			return;
		} else if (result.length != 0) {
			callback("Квест с активной регистрацией уже существует.");
			return;
		} else {
			callback(null);
			return;
		}
	});
	// checkQuestExists closed
}