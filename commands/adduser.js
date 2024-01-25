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
		.setName('adduser')
		.setDescription('Добавить пользователя в базу данных сообщества.')
		.addUserOption(option =>
			option.setName('target_user')
				.setDescription('Имя пользователя')
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

		await interaction.guild.members.fetch(target_user).then(
			fetchedUser => {
				checkProfileExists(fetchedUser.user.id, function (error) {
					if (error) {
						const locales = {
							"en-US": 'An error occurred while checking user profile exists.'
						};
						interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
					} else {
						createProfile(fetchedUser.user.id, function (error) {
							if (error) {
								const locales = {
									"en-US": 'An error occurred while creating new user profile.'
								};
								interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
							} else {
								let embed_username = fetchedUser.nickname ?? fetchedUser.user.username;
								interaction.reply({ content: 'Создан новый профиль пользователя для ' + embed_username, ephemeral: true });

								var embed_adduser = {
									title: "Ваш профиль добавлен в Систему достижений!",
									description: "Участвуя в мероприятиях сообщества, Вы можете получать достижения и золотые монеты за них. Просмотреть список достижений можно, воспользовавшись командой /profile.",
									color: 0x0099ff,
									thumbnail: {
										url: "https://r.snfx.ee/img/discord_bot/alert_note.png"
									},
									fields: [
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

								var component_buttons = {
									type: 1,
									components: [
										{
											type: 2,
											label: "Смотреть профиль",
											style: 1,
											custom_id: "profile_show"
										},
										{
											type: 2,
											label: "Подробнее о Системе достижений",
											style: 5,
											url: "https://vk.com/@viruviking-sistema-dostizhenii-vikingov-virumaa"
										}
									]
								}
								const UserNotify = interaction.client.channels.cache.get(config.log_channel_id);
								UserNotify.send({ content: `${fetchedUser.user}, для Вас весть от Хугинна:`, embeds: [embed_adduser], components: [component_buttons] });
							}
						});
					}
					// checkProfileExists closed
				});
				// members.fetch closed
			}).catch(console.error);
	},
};

checkProfileExists = function (user_id, callback) {
	// Prepare MySQL request check if user with the same uid already exists	
	let sql1 = "SELECT * FROM drd_users WHERE uid = ?;";
	database.query(sql1, [user_id], (error1, results, fields) => {
		if (error1) {
			callback("Ошибка в работе базы данных.");
			return;
		} else if (results.length != 0) {
			callback("Данный профиль уже существует. Невозможно создать профиль.");
			return;
		} else {
			callback(null);
			return;
		}
	});
	// getProfile closed
}

getProfile = function (user_id, callback) {
	// Prepare MySQL request to retrieve user data	
	let sql2 = "SELECT drd_users.uid, drd_users.level, drd_users.coins, drd_levels.title, drd_levels.symbol FROM drd_users LEFT JOIN drd_levels ON drd_users.level = drd_levels.level WHERE drd_users.uid = ? LIMIT 1;";
	database.query(sql2, [user_id], (error2, result_userdata, fields) => {
		if (error2) {
			callback("Ошибка в работе базы данных.", null);
			return;
		} else if (result_userdata.length == 0 || result_userdata.length > 1) {
			callback("Ошибка получения профиля пользователя.", null);
			return;
		} else {
			callback(null, result_userdata[0]);
		}
	});
	// getProfile closed
}

getProgress = function (user_id, user_level, callback) {
	let sql3 = "SELECT drd_achievements.code, drd_achievements.title, drd_achievements.description, drd_usr_ach.date FROM drd_achievements LEFT JOIN drd_usr_ach ON drd_achievements.code = drd_usr_ach.ach_id AND drd_usr_ach.user_id = ? WHERE drd_achievements.level = ?;";
	database.query(sql3, [user_id, user_level], function (error3, result_levels, fields) {
		if (error3) {
			callback('Ошибка получения достижений пользователя.', null);
			return;
		} else if (result_levels.length == 0) {
			callback('Ошибка получения достижений пользователя.', null);
			return;
		} else {
			callback(null, result_levels);
		}
	});
	// getProgress closed
}

createProfile = function (user_id, callback) {
	// Prepare MySQL request to add new user data	
	let sql4 = "INSERT INTO drd_users (uid, level, community) VALUES (?, 0, 'viruviking');";
	// TODO: Remove community title when database migrates to SQLite  
	database.query(sql4, [user_id], (error4, pingback) => {
		if (error4) {
			callback("Ошибка создания профиля пользователя.");
			return;
		} else {
			callback(null);
		}
	});
	// createProfile closed
}