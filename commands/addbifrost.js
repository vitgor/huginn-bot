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
		.setName('addbifrost')
		.setDescription('Добавить профиль пользователя Bifrost Connect')
		.addUserOption(option =>
			option.setName('target_user')
			.setDescription('Имя пользователя')
			.setRequired(true))
		.addStringOption(option =>
			option.setName('steam_id')
			.setDescription('Идентификатор Steam')
			.setRequired(false))
        .addStringOption(option =>
            option.setName('xbox_id')
            .setDescription('Идентификатор Xbox')
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
        
	async execute(interaction) {
		const hasAdminRole = interaction.member.roles.cache.some(r => JSON.stringify(config.admin_roles).includes(r.name))
		if (hasAdminRole == false) {
			const locales = {
				"en-US": 'You do not have permission to execute this command!'
			};
			await interaction.reply(locales[interaction.locale] ?? 'У вас недостаточно прав для выполнения этой команды!');
		} else {

        const target_user = interaction.options.getUser('target_user');
		const target_steamid = interaction.options.getString('steam_id');
        const target_xboxid = interaction.options.getString('xbox_id');

		await interaction.guild.members.fetch(target_user).then(
			fetchedUser => {
				existsBifrost(fetchedUser.user.id,function(error,profile_count){
					if (error || profile_count > 1) {
						const locales = {
							"en-US": 'An error occurred while creating/updating Bifröst profile.',
							};
						interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });						
					}else if (profile_count == 1){
                        updateBifrost(fetchedUser.user.id, target_steamid, target_xboxid, function(error){
                            if (error) {
                                const locales = {
                                    "en-US": 'An error occurred while Bifröst pofile updating.'
                                    };
                                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
                            } else {
                                interaction.reply({ content: 'Bifröst profile has been successfully updated!', ephemeral: true });
                            }
                        });
                    }else{
                        addBifrost(fetchedUser.user.id, target_steamid, target_xboxid, function(error){
                            if (error) {
                                const locales = {
                                    "en-US": 'An error occurred while Bifröst pofile creating.'
                                    };
                                interaction.reply({ content: locales[interaction.locale] ?? error, ephemeral: true });
                            } else {
                                const role_id = config.bifrost_config.roleid;
                                const get_role_by_id = interaction.guild.roles.cache.find(role => role.id === role_id);
                                fetchedUser.roles.add(get_role_by_id);
                                interaction.reply({ content: 'Bifröst profile has been successfully created!', ephemeral: true });
                            }
                        });
                    }
                });
            }
        );
        }
	},
};

addBifrost = function(data_id, data_steamid, data_xboxid, callback) {
	let sql1 = "INSERT INTO drd_bifrost (user_uid, steam_id, xbox_id) VALUES (?,?,?);";
    database.query(sql1, [data_id,data_steamid,data_xboxid], (error1, pingback) => {
        if (error1) {
            callback("Ошибка добавления профиля пользователя Bifröst.");
            return;
	    } else {
			callback(null);
	    }
    }); 
// addBifrost ended
}

updateBifrost = function(data_id, data_steamid, data_xboxid, callback) {
	let sql2 = "UPDATE drd_bifrost SET steam_id = ?, xbox_id = ? WHERE user_uid = ?;"; 
    database.query(sql2, [data_steamid,data_xboxid,data_id], (error2, pingback) => {
        if (error2) {
            callback("Ошибка обновления профиля пользователя Bifröst.");
            return;
	    } else {
			callback(null);
	    }
    }); 
// updateBifrost ended
}

existsBifrost = function (data_id, callback) {
	let sql3 = "SELECT count(*) AS rowscount FROM drd_bifrost WHERE user_uid = ?;";
	database.query(sql3, [data_id], (error3, check_added, fields) => {
		if (error3) {
			callback("Ошибка в работе базы данных.",null);
			return;
		} else {
            callback(null,check_added[0].rowscount);
            return;
		}
	});
	// existsBifrost closed
}