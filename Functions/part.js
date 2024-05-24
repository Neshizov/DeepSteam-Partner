const fs = require('fs');
const path = require('path');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { CHANNEL_ID } = process.env;

const databasePath = path.resolve(__dirname, '..', 'Database', 'Partners.txt');

function monitorChannel(client) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error(`Канал с айди ${CHANNEL_ID} не найден.`);
        return;
    }

    client.on('messageCreate', async message => {
        if (message.channel.id !== CHANNEL_ID) return;

        if (message.content.length > 1) {
            const userId = message.author.id;
            const timestamp = Date.now();
            const discordLink = extractDiscordLink(message.content);
            const serverName = extractServerName(message.content);

            if (!discordLink || !serverName) return;

            const partnersData = readDatabase(databasePath);
            const userLastEntry = partnersData.filter(entry => entry.userId === userId).pop();

            if (userLastEntry && (timestamp - userLastEntry.timestamp) < 1) { // 24 часа
                message.delete();
                message.author.send('Вы можете заключить новое партнёрство только через 24 часа.');
                return;
            }

            const partnershipCount = partnersData.length;

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('Заключено новое партнёрство')
                .setDescription(`Участник **${message.author}** заключил(а) партнёрство!\n\n**Название сервера:** ${serverName}\n**Ссылка на сервер:** ${discordLink}\n\nВсего заключено партнёрств: \`${partnershipCount + 1}\`\n\nСпасибо за то, что продвигаете сервер при помощи партнёрств!`);

            const button = new MessageButton()
                .setLabel('Перейти на сервер!')
                .setStyle('LINK')
                .setURL(discordLink);

            const row = new MessageActionRow().addComponents(button);

            channel.send({ embeds: [embed], components: [row] });

            const newEntry = `${userId};${timestamp};${discordLink};${serverName}\n`;
            fs.appendFileSync(databasePath, newEntry);
        }
    });
}

function extractDiscordLink(content) {
    const regex = /(https:\/\/discord\.gg\/[^\s]+)/;
    const match = content.match(regex);
    return match ? match[1] : null;
}

function extractServerName(content) {
    const regex = /Название сервера:\s*(.+)/;
    const match = content.match(regex);
    return match ? match[1] : null;
}

function readDatabase(filePath) {
    if (!fs.existsSync(filePath)) return [];
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split('\n').filter(line => line.trim()).map(line => {
        const [userId, timestamp, discordLink, serverName] = line.split(';');
        return { userId, timestamp: parseInt(timestamp), discordLink, serverName };
    });
}

module.exports = { monitorChannel };
