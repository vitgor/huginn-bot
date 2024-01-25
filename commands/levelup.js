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
		.setName('levelup')
		.setDescription('Добавить достижение для выбранного пользователя.')
		.addUserOption(option =>
			option.setName('target_user')
				.setDescription('Имя пользователя')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('achievement_code')
				.setDescription('Код достижения')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {
		const hasAdminRole = interaction.member.roles.cache.some(r => JSON.stringify(config.admin_roles).includes(r.name))
		if (hasAdminRole == false) {
			const locales = {
				"en-US": 'You do not have permission to execute this command!'
			};
			await interaction.reply(locales[interaction.locale] ?? 'У вас недостаточно прав для выполнения этой команды!');
		}

		const target_user = interaction.options.getUser('target_user');
		const target_achievement = interaction.options.getString('achievement_code');
		const UserNotify = interaction.client.channels.cache.get(config.log_channel_id);

		await interaction.guild.members.fetch(target_user).then(
			fetchedUser => {
				getAchievementProfile(fetchedUser.user.id, function (error, user_profile) {
					if (error) {
						const locales = {
							"en-US": 'An error occurred while retrieving user profile.',
						};
						interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
					} else {
						checkAchievement(user_profile, target_achievement, function (error, achievement_data) {
							if (error) {
								const locales = {
									"en-US": 'An error occurred while retrieving achievement data.'
								};
								interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
							} else {
								addAchievement(user_profile, achievement_data, function (error) {
									if (error) {
										const locales = {
											"en-US": 'An error occurred while user pofile updating.'
										};
										interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
									} else {
										let embed_username = fetchedUser.nickname ?? fetchedUser.user.username;
										var embed_achievement = {
											title: embed_username + " получил новую ачивку!",
											color: 0x0099ff,
											thumbnail: {
												url: "https://r.snfx.ee/img/discord_bot/alert_scroll.png"
											},
											fields: [
												{
													name: ":ballot_box_with_check: - " + achievement_data.title + " (" + achievement_data.coins + " золотых)",
													value: achievement_data.description
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
										UserNotify.send({ content: `${fetchedUser.user}, для Вас весть от Хугинна:`, embeds: [embed_achievement] });

										updateLevel(user_profile, function (error, updated_profile) {
											if (error) {
												const locales = {
													en: 'An error occurred while user pofile updating.'
												};
												interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
											} else {
												let embed_username = fetchedUser.nickname ?? fetchedUser.user.username;
												var embed_levelup = {
													title: embed_username + " получил новый уровень!",
													color: 0x0099ff,
													thumbnail: {
														url: "https://r.snfx.ee/img/discord_bot/alert_announcement.png"
													},
													fields: [
														{
															name: (String.fromCodePoint(updated_profile.symbol) + ' ' + updated_profile.title),
															value: updated_profile.level + ' уровень'
														},
														{
															name: "\u200b",
															value: "\u200b"
														}
													],
													timestamp: new Date().toISOString(),
													footer: {
														icon_url: config.ui.icon_url,
														text: config.ui.title
													},
												}

												UserNotify.send({ embeds: [embed_levelup] });
												interaction.reply({ content: 'Command has been successfully executed!', ephemeral: true });
											}
											// updateLevel closed
										});
									}
									// addAchievement closed
								});
							}
							// checkAchievement closed
						});
					}
					// getProfile closed
				});
				// fetchedUser closed
			}
			// await interaction.guild.members.fetch closed
		);
	}
};

getAchievementProfile = function (user_id, callback) {
	// Prepare MySQL request to retrieve user profile and achievement data	
	let sql1 = "SELECT drd_users.id, drd_users.uid, drd_users.level, drd_users.coins, drd_levels.title, drd_levels.symbol FROM drd_users LEFT JOIN drd_levels ON drd_users.level = drd_levels.level WHERE uid = ? LIMIT 1;";
	database.query(sql1, [user_id], (error1, results, fields) => {
		if (error1) {
			callback("Ошибка в работе базы данных.", null);
			return;
		}
		if (results.length == 0 || results.length > 1) {
			callback("Ошибка получения профиля пользователя.", null);
			return;
		}
		callback(null, results[0]);
	});
	// getProfile closed
}

checkAchievement = function (user_data, achievement_code, callback) {
	// Check thе achievement exists and is available for user level
	let sql2 = "SELECT * FROM drd_achievements WHERE code = ? AND level = ?;";
	database.query(sql2, [achievement_code, user_data.level], (error2, achievement_fulldata, fields) => {
		if (error2) {
			callback("Ошибка в работе базы данных.", null);
			return;
		}
		if (achievement_fulldata.length != 1) {
			callback("Указанное достижение не существует или не доступно для выбранного пользователя.", null);
			return;
		}
		// Check if achivement is already added for selected user
		let sql3 = "SELECT count(*) AS rowscount FROM drd_usr_ach WHERE user_id = ? AND ach_id = ?;";
		database.query(sql3, [user_data.uid, achievement_code], (error3, check_added, fields) => {
			if (error3) {
				callback("Ошибка в работе базы данных.", null);
				return;
			}
			if (check_added[0].rowscount > 0) {
				callback("Указанное достижение уже добавлено для выбранного пользователя.", null);
				return;
			}
			callback(null, achievement_fulldata[0]);
		});
	});
	// checkAchievement ended
}

addAchievement = function (user_data, achievement_data, callback) {
	// Add achivement for user
	let sql4 = "INSERT INTO drd_usr_ach (user_id, ach_id) VALUES (?,?);";
	database.query(sql4, [user_data.uid, achievement_data.code], (error4, pingback) => {
		if (error4) {
			callback("Ошибка добавления достижения в профиль пользователя.");
			return;
		} else {
			var coins_sum = parseInt(user_data.coins) + parseInt(achievement_data.coins);
			// Prepare MySQL request to update soins sum for selected user
			let sql5 = "UPDATE drd_users SET coins = ? WHERE uid = ?;";
			database.query(sql5, [coins_sum, user_data.uid], (error5, pingback) => {
				if (error5) {
					callback("Ошибка обновления профиля пользователя.");
					return;
				} else {
					callback(null);
				}
			});
		}
	});
	// addAchievement ended
}

updateLevel = function (user_data, callback) {
	// Get available and done achievement count
	let sql6 = "SELECT count(*) AS needed_count FROM drd_achievements WHERE level = ?; SELECT count(*) AS done_count FROM drd_usr_ach LEFT JOIN drd_achievements ON drd_usr_ach.ach_id = drd_achievements.code WHERE drd_achievements.level = ? AND drd_usr_ach.user_id = ?;"
	database.query(sql6, [user_data.level, user_data.level, user_data.uid], (error6, results6, fields) => {
		if (error6) {
			callback("Ошибка в работе базы данных.", null);
			return;
		} else {
			var parsed_done_count = parseInt(results6[1][0].done_count);
			var parsed_needed_count = parseInt(results6[0][0].needed_count);
			console.log("Update Level? Achievements: " + parsed_done_count + "/" + parsed_done_count);
			if (parsed_done_count === parsed_needed_count) {
				// Levelup in case of user has been done all available achievements
				let lvl_sum = user_data.level + 1;
				let sql7 = "UPDATE drd_users SET level =? WHERE uid =?;";
				database.query(sql7, [lvl_sum, user_data.uid], (error7, pingback) => {
					if (error7) {
						callback("Ошибка обновления профиля пользователя.", null);
						return;
					}
					getProfile(user_data.uid, function (error, user_profile_updated) {
						if (error) {
							callback("Ошибка получения профиля пользователя.", null);
							return;
						} else {
							callback(null, user_profile_updated);
						}
					});
				});
			} else if (parsed_done_count < parsed_needed_count) {
				callback("Выбранный профиль пользователя не получит новый уровень (" + parsed_done_count + " достижений из " + parsed_needed_count + ").", null);
				return;
			} else {
				callback("Ошибка обновления уровня профиля пользователя.", null);
				return;
			}
		}
	});
	// updateLevel ended
}