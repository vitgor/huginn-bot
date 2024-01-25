const { Events } = require('discord.js');
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
	name: Events.ClientReady,
	once: true,
	execute(client) {
        database.connect(function(err) {
            if (err) {
              return console.error('error: ' + err.message);
            }
            console.log('Connected to the MySQL server database '+ config.db_config.dbname +'@'+ config.db_config.host +'.');
          });
          console.log(`Logged in Discord as ${client.user.tag}!`);
	},
};
