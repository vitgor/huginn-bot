const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Показывает страницу справки по боту Huginn.')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {

		var embed_help = {
			title: "Помощь по командам бота на сервере Sunfox.ee",
			description: "Мы значительно обновили функции бота и добавили новые команды. Ниже приведен их список и описание.",
			color: 0x0099ff,
			fields: [
				{
					name: "/profile <target_user>",
					value: "Просмотреть профиль пользователя. Пользователи могут просматривать только собственные профили, участники с ролью администраторов могут просмотреть профили других пользователей.",
				},
				{
					name: "/roll <dice_type> <private>",
					value: "Кинуть выбранный кубик и показать результат в чате.",
				},
				{
					name: "/card <private>",
					value: "Вытащить случайную карту из колоды и показать результат в чате.",
				},
				{
					name: "/adduser <target_user>",
					value: "Добавить пользователя в базу данных сообщества. Пользователь получит уведомление, и сможет просматривать свой профиль,а также регистрироваться на мероприятия и квесты сообщества. Команда доступна только участникам с ролью администратора.",
				},
				{
					name: "/addcoins <target_user> <coins_amount>",
					value: "Добавить монеты на аккаунт пользователя. Пользователь получит уведомление, и сможет проверить сумму момент в профиле. Команда доступна только участникам с ролью администратора.",
				},
				{
					name: "/addevent <event_type>",
					value: "Показывает форму создания события одного из двух типов: мероприятие или квест. После отправки формы, мероприятие/квест будет создано в базе данных, а пользователи получат уведомление с возможностью зарегистрироваться участником мероприятия/квеста или отказаться от него. Команда доступна только участникам с ролью администратора.",
				},
				{
					name: "/listevent <event_type>",
					value: "Показывает список зарегистрированных на мероприятие или квест - в зависимости от выбранного типа мероприятия. Команда доступна только участникам с ролью администратора.",
				},
				{
					name: "/play2gether <link>",
					value: "Генерирует ссылку на сайт микросервиса Bifröst Connect для доступа к игровому лобби Steam. Команда доступна пользователям с ролью Биврёст.",
				}
			],
			timestamp: new Date().toISOString(),
			footer: {
				icon_url: config.ui.icon_url,
				text: config.ui.title
			},
		}
		// var component_buttons = {
		// 	"type": 1,
		// 	"components": [
		// 		{
		// 			"type": 2,
		// 			"label": "Read more",
		// 			"style": 5,
		// 			"url": "https://example.com"
		// 		},
		// 		{
		// 			"type": 2,
		// 			"label": "Read more",
		// 			"style": 5,
		// 			"url": "https://example.com"
		// 		}
		// 	]
		// }

		await interaction.reply({ content: `${interaction.member.nickname ?? interaction.member.user.username}, это актуальная страница помощи по командам бота:`, embeds: [embed_help], components: [component_buttons], ephemeral: true });
	},
};
