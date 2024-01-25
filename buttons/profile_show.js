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
        name: 'profile_show'
    },
    async execute(interaction) {
        var member_id = interaction.member.user.id;
        await interaction.guild.members.fetch(member_id).then(
            fetchedUser => {
                getHiddenProfile(fetchedUser.user.id, function (error, user_profile) {
                    if (error) {
                        const locales = {
                            "en-US": 'An error occurred while retrieving user profile.'
                        };
                        interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
                    } else {
                        getHiddenProgress(fetchedUser.user.id, user_profile.level, function (error, user_progress) {
                            if (error) {
                                const locales = {
                                    "en-US": 'An error occurred while retrieving user profile.'
                                };
                                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
                            } else {

                                const embed_progress = [{ name: "\u200b", value: "\u200b" }];

                                for (i = 0; i < user_progress.length; i++) {

                                    if (user_progress[i].date === null) {
                                        var item_checkbox = ':white_medium_square:';
                                    } else {
                                        var item_checkbox = ':ballot_box_with_check:';
                                    }
                                    item_name = item_checkbox + " - " + user_progress[i].title;

                                    var embed_progress_item = { name: item_name, value: user_progress[i].description };
                                    embed_progress.push(embed_progress_item);
                                }

                                embed_progress.push({ name: "\u200b", value: "\u200b" });

                                var embed_profile = {
                                    title: (String.fromCodePoint(user_profile.symbol) + ' ' + user_profile.title),
                                    description: user_profile.level + ' уровень | ' + user_profile.coins + ' золотых',
                                    color: 0x0099ff,
                                    thumbnail: {
                                        url: "https://cdn.discordapp.com/avatars/" + fetchedUser.user.id + "/" + fetchedUser.user.avatar + ".png"
                                    },
                                    author: {
                                        name: fetchedUser.nickname ?? fetchedUser.user.username
                                    },
                                    fields: embed_progress,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        icon_url: "https://sunfox.ee/resources/img/discord_bot/vv_sq_logo.png",
                                        text: "Викинги Вирумаа"
                                    },
                                }

                                interaction.reply({ embeds: [embed_profile], ephemeral: true });
                                // else closed
                            }
                            // getProgress closed
                        });
                        // else closed
                    }
                    // getProfile closed
                });
                // fetchedUser closed
            }
            // await interaction.guild.members.fetch closed
        ).catch(console.error);
    }
}


getHiddenProfile = function (user_id, callback) {
    // Prepare MySQL request to retrieve user data	
    let sql1 = "SELECT drd_users.uid, drd_users.level, drd_users.coins, drd_levels.title, drd_levels.symbol FROM drd_users LEFT JOIN drd_levels ON drd_users.level = drd_levels.level WHERE drd_users.uid = ? LIMIT 1;";
    database.query(sql1, [user_id], (error1, result_userdata, fields) => {
        if (error1) {
            callback("Ошибка в работе базы данных.", null);
            return;
        }
        if (result_userdata.length == 0 || result_userdata.length > 1) {
            callback("Ошибка получения профиля пользователя.", null);
            return;
        }
        callback(null, result_userdata[0]);
    });
    // getProfile closed
}

getHiddenProgress = function (user_id, user_level, callback) {
    // Prepare MySQL request to retrieve user achievements
    let sql2 = "SELECT drd_achievements.code, drd_achievements.title, drd_achievements.description, drd_usr_ach.date FROM drd_achievements LEFT JOIN drd_usr_ach ON drd_achievements.code = drd_usr_ach.ach_id AND drd_usr_ach.user_id = ? WHERE drd_achievements.level = ?;";
    database.query(sql2, [user_id, user_level], function (error2, result_levels, fields) {
        if (error2) {
            callback('Ошибка получения достижений пользователя.', null);
            return;
        }
        if (result_levels.length == 0) {
            callback('Ошибка получения достижений пользователя.', null);
            return;
        }
        callback(null, result_levels);
    });
    // getProgress closed
}