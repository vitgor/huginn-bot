const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const UserNotify = member.client.channels.cache.get(config.log_channel_id);
        UserNotify.send({content: `Привет, ${member.user}! Рады тебя видеть на нашем сервере :) Если ты используешь ник вместо настоящего имени, пожалуйста смени его на свое имя. Спасибо!`});	
    },
};