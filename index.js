const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const mysql = require('mysql');
const database = mysql.createConnection({
	host: config.db_config.host,
	user: config.db_config.dbuser,
	password: config.db_config.dbpass,
	database: config.db_config.dbname,
	debug: false,
	multipleStatements: true,
});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences
	]
});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.buttons = new Collection();
const buttonsPath = path.join(__dirname, 'buttons');
const buttonsFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
for (const file of buttonsFiles) {
	const filePath = path.join(buttonsPath, file);
	const button = require(filePath);
	client.buttons.set(button.data.name, button);
}

client.modals = new Collection();
const modalsPath = path.join(__dirname, 'modals');
const modalsFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));
for (const file of modalsFiles) {
	const filePath = path.join(modalsPath, file);
	const modal = require(filePath);
	client.modals.set(modal.data.name, modal);
}

client.login(config.token);
