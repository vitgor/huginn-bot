//const {} = require('discord.js');
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
        name: 'quest_accept'
    },
    async execute(interaction) {

        const user_uid = interaction.user.id;

        checkQuestAcceptedProfileExists(user_uid,function(error){
            if (error) {
                const locales = {
                    "en-US": 'User profile does not exists.'
                    };
                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });						
            } else {
                checkQuestRegistrationAvailable(function(error,event_data){
                    if (error) {
                        const locales = {
                            "en-US": 'Available event does not exists.'
                            };
                        interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });						
                    } else { 
                        var event_id = event_data.id;

                        addQuestRegistrationAccept(user_uid, event_id ,function(error){
                            if (error) {
                                const locales = {
                                    "en-US": 'An error occurred during the registration'
                                    };
                                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });						
                            } else {
                                interaction.reply({ content: `— В путь, приключенец! Возвращайся за наградой.`, ephemeral: true });
                            }
                        });
                    }
                });
            }
        });
    }
}

checkQuestRegistrationAvailable = function (callback) {
	// Prepare MySQL request check if there is opened-registration event	
	let sql1 = "SELECT * FROM `quests` WHERE `quest_date` > NOW() LIMIT 1;";
	database.query(sql1, (error1, result, fields) => {
		if (error1) {
			callback("Ошибка в работе базы данных (checkQuestRegistrationAvailable).",null);
			return;
		} else if (result.length != 1) {
			callback("Отсуствуют квесты с активной регистрацией.",null);
			return;
		} else {
			callback(null,result[0]);
		}
	});
	// checkEventExists closed
}

checkQuestAcceptedProfileExists = function (user_uid, callback) {
	// Prepare MySQL request check if user with the same uid already exists	
	let sql2 = "SELECT * FROM drd_users WHERE uid = ?;";
	database.query(sql2, [user_uid], (error2, results, fields) => {
		if (error2) {
			callback("Ошибка в работе базы данных (checkQuestAcceptedProfileExists).");
			return;
		} else if (results.length != 1) {
			callback("— Этот квест не для тебя, дружок! Проходи мимо...");
			return;
		} else {
			callback(null);
			return;
		}
	});
	// checkProfileExists closed
}

addQuestRegistrationAccept = function(user_uid, event_id, callback) {
	// Add achivement for user
	let sql3 = "INSERT INTO quests_usr (user_uid, quest_id, user_status) VALUES (?,?,'1');";
    database.query(sql3, [user_uid,event_id], (error3, pingback) => {
        if (error3) {
            callback("Ошибка добавления регистрации на квест (addQuestRegistrationAccept).");
            return;
        } else {
			callback(null);
		}
    }); 
// addRegistration ended
}
