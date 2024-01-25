const { SlashCommandBuilder } = require('discord.js');
const Roll20 = require('d20');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Кинуть выбранный дайс.')
		.addStringOption(option =>
			option.setName('dice_type')
				.setDescription('Тип дайса (d4, d6, d8, d12, d20)')
				.setRequired(false)
				.addChoices(
					{ name: 'd4', value: 'd4' },
					{ name: 'd6', value: 'd6' },
					{ name: 'd8', value: 'd8' },
					{ name: 'd12', value: 'd12'},
					{ name: 'd20', value: 'd20'}
				))
		.addBooleanOption(option =>
			option.setName('private')
				.setRequired(false)
				.setDescription('Скрыть результат')),

	async execute(interaction) {
		const data_dice = interaction.options.getString('dice_type') ?? 'd6';
		const data_hide = interaction.options.getBoolean('private') ?? false;
		let p = data_dice.match(/(\d{0,1})[d](\d{1,2})/g);
		result = Roll20.verboseRoll(p[0]);  
		var img =  data_dice + '-' + result + '.png';
		await interaction.reply({files: ['https://r.snfx.ee/img/discord_bot/dice/' + img], ephemeral: data_hide  });	

	},
};