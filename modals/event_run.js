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
        name: 'event_run'
    },
    async execute(interaction) {
        const event_title = interaction.fields.getTextInputValue('event_title');
        const event_datetime = interaction.fields.getTextInputValue('event_datetime');
        const event_location = interaction.fields.getTextInputValue('event_location');
        const event_description = interaction.fields.getTextInputValue('event_description');
        const event_url = interaction.fields.getTextInputValue('event_url');

        const event_datetime_db = new Date(parseDate(event_datetime));
        const UserNotify = interaction.client.channels.cache.get(config.log_channel_id);

        createEvent(event_title, format(new Date(event_datetime_db), 'YYYY-MM-DD HH-mm-00'), event_location, event_description, event_url, (error) => {
            if (error) {
                const locales = {
                    en: 'An error occurred while creating event.',
                    et: 'Uue sündmuse loomisel on tekkinud viga.',
                };
                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
            } else {

                const embed_event = {
                    title: event_title,
                    description: event_description,
                    color: 0x0099ff,
                    thumbnail: {
                        url: "https://r.snfx.ee/img/discord_bot/alert_note.png"
                    },
                    fields: [
                        {
                            name: "Дата проведения",
                            value: format(new Date(event_datetime_db), 'DD.MM.YYYY, HH:mm'),
                            inline: true
                        },
                        {
                            name: "Место проведения",
                            value: event_location,
                            inline: true
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
                            label: "Участвую",
                            style: 3,
                            custom_id: "event_accept"
                        },
                        {
                            type: 2,
                            label: "Не участвую",
                            style: 4,
                            custom_id: "event_decline"
                        },
                    ]
                }
                if (event_url != '') {
                    component_buttons["components"].push(
                        {
                            type: 2,
                            label: "Подробнее о мероприятии",
                            style: 5,
                            url: event_url
                        }
                    );
                } 

                UserNotify.send({ content: `<@&${config.event_notify_role_id}>, Хугинн принес весть о грядущем событии:`, embeds: [embed_event], components: [component_buttons] });
                interaction.reply({ content: 'Event has been successfully created!', ephemeral: true });
            }
        });        
    }
}

createEvent = function (title, datetime, location, description, url, callback) {
	// Prepare MySQL request to add a new event	
	let sql1 = "INSERT INTO events (event_title, event_date, event_location, event_description, event_url) VALUES (?,?,?,?,?);"; 
	database.query(sql1, [title, datetime, location, description, url], (error4, pingback) => {
	    if (error4) {
	        callback("Ошибка добавления события в БД.");
	        return;
	    } else {
			callback(null);
	    }
	});
	// createEvent closed
}

parseDate = function (data) {
    return parse(data, 'DD/MM/YYYY HH:mm');
}