//const {} = require('discord.js');
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
    data: {
        name: 'quest_run'
    },
    async execute(interaction) {
        const quest_title = interaction.fields.getTextInputValue('quest_title');
        const quest_description = interaction.fields.getTextInputValue('quest_description');
        const quest_datetime = interaction.fields.getTextInputValue('quest_datetime');
        const quest_reward = interaction.fields.getTextInputValue('quest_reward');

        const quest_datetime_db = new Date(parseDate(quest_datetime));
        const UserNotify = interaction.client.channels.cache.get(config.log_channel_id);

        createQuest(quest_title, quest_description, format(new Date(quest_datetime_db), 'YYYY-MM-DD HH-mm-00'), quest_reward, (error) => {
            if (error) {
                const locales = {
                    en: 'An error occurred while quest creating.',
                    et: 'Eesmärgi loomisel on tekkinud viga.',
                };
                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
            } else {
                const embed_quest = {
                    title: quest_title,
                    color: 0x0099ff,
                    thumbnail: {
                        url: "https://r.snfx.ee/img/discord_bot/alert_scroll.png"
                    },
                    fields: [
                        {
                            name: "Суть задания",
                            value: quest_description,
                        },
                        {
                            name: "Срок исполнения",
                            value: format(new Date(quest_datetime_db), 'DD.MM.YYYY, HH:mm'),
                        },
                        {
                            name: "Вознаграждение",
                            value: quest_reward,
                        },
                        {
                            name: "\u200b",
                            value: "\u200b"
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        icon_url: "https://sunfox.ee/resources/img/discord_bot/vv_sq_logo.png",
                        text: "Викинги Вирумаа"
                    },
                }
                const component_buttons = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: "Принять",
                            style: 3,
                            custom_id: "quest_accept"
                        },
                        {
                            type: 2,
                            label: "Как работают квесты?",
                            style: 5,
                            url: "https://wiki.sunfox.ee/public:services_bot_quests"
                        },
                    ]
                }

                UserNotify.send({ content: "— У меня есть для тебя задание, приключенец. И отличная награда!", embeds: [embed_quest], components: [component_buttons] });
                interaction.reply({ content: 'Quest has been successfully created!', ephemeral: true });
            }
        });        
    }
}

createQuest = function (title, description, date, reward, callback) {
	// Prepare MySQL request to add a new event	
	let sql1 = "INSERT INTO quests (quest_title, quest_description, quest_date, quest_reward) VALUES (?,?,?,?);"; 
	database.query(sql1, [title, description, date, reward], (error4, pingback) => {
	    if (error4) {
	        callback("Ошибка добавления квеста в БД.");
	        return;
	    } else {
			callback(null);
	    }
	});
	// createQuest closed
}

parseDate = function (data) {
    return parse(data, 'DD/MM/YYYY HH:mm');
}