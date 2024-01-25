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
		.setName('addcoins')
		.setDescription('Добавить монеты на аккаунт пользователя.')
		.addUserOption(option =>
			option.setName('target_user')
				.setDescription('Имя пользователя')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('coins_count')
				.setDescription('Количество монет')
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
		const data_coins = interaction.options.getString('coins_count');

		await interaction.guild.members.fetch(target_user).then(fetchedUser => {

			getProfile(fetchedUser.user.id, function (error, user_profile) {
				if (error) {
					const locales = {
						"en-US": 'An error occurred while retrieving user profile.'
					};
					interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
				} else {

					let coins_sum = parseInt(user_profile.coins) + parseInt(data_coins);

					updateCoins(fetchedUser.user.id, coins_sum, function (error) {
						if (error) {
							const locales = {
								"en-US": 'An error occurred while updating user profile.'
							};
							interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
						} else {
							let embed_username = fetchedUser.nickname ?? fetchedUser.user.username;
							var embed_addcoins = {
								title: embed_username + " получил монеты!",
								description: "На аккаунт пользователя добавлено " + data_coins + " золотых.",
								color: 0x0099ff,
								thumbnail: {
									url: "https://r.snfx.ee/img/discord_bot/alert_coins.png"
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

							const UserNotify = interaction.client.channels.cache.get(config.log_channel_id);
							UserNotify.send({ content: `${fetchedUser.user}, для Вас весть от Хугинна:`, embeds: [embed_addcoins] });
							interaction.reply({ content: 'Command has been successfully executed!', ephemeral: true });

						}
						// updateCoins closed
					});
					// else closed
				}
				// getProfile closed
			}).catch(console.error);
			// await interaction.guild.members.fetch closed
		});
	}
};

getProfile = function (user_id, callback) {
	// Prepare MySQL request to retrieve user data	
	let sql1 = "SELECT id, uid, coins FROM drd_users WHERE uid = ? LIMIT 1;";
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
}

updateCoins = function (user_id, coins, callback) {
	// Prepare MySQL request to update soins sum for selected user
	let sql2 = "UPDATE drd_users SET coins = ? WHERE uid = ?;";
	database.query(sql2, [coins, user_id], (error2, pingback) => {
		if (error2) {
			callback("Ошибка обновления профиля пользователя.");
			return;
		}
		callback(null);
	});
}
