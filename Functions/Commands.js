const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

const databasePath = path.resolve(__dirname, '..', 'Database', 'Partners.txt');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('статистика')
        .setDescription('Показывает статистику партнёрств')
        .addUserOption(option => 
            option.setName('пользователь')
                  .setDescription('Пользователь для просмотра статистики')
                  .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('пользователь');
        const partnersData = readDatabase(databasePath);
        let stats;

        if (user) {
            stats = calculateUserStatistics(partnersData, user.id);
        } else {
            stats = calculateStatistics(partnersData);
        }

        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('Статистика партнёрств')
            .setDescription(user ? `Статистика пользователя <@${user.id}>:\n${stats}` : `Топ людей, заключивших партнёрства:\n${stats}`)
            .setFooter(`Статистика на ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })} по МСК`);

        await interaction.reply({ embeds: [embed] });
    },
};

function readDatabase(filePath) {
    if (!fs.existsSync(filePath)) return [];
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split('\n').filter(line => line.trim()).map(line => {
        const [userId, timestamp, discordLink, serverName] = line.split(';');
        return { userId: cleanString(userId), timestamp: parseInt(timestamp), discordLink: cleanString(discordLink), serverName: cleanString(serverName) };
    });
}

function calculateStatistics(data) {
    const userStats = {};

    data.forEach(entry => {
        if (!userStats[entry.userId]) {
            userStats[entry.userId] = { count: 0, links: new Set() };
        }
        if (!userStats[entry.userId].links.has(entry.discordLink)) {
            userStats[entry.userId].count += 1;
            userStats[entry.userId].links.add(entry.discordLink);
        }
    });

    const statsArray = Object.entries(userStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([userId, { count }]) => `<@${cleanString(userId)}> - ${count}`);

    return statsArray.join('\n');
}

function calculateUserStatistics(data, userId) {
    const userStats = data.filter(entry => entry.userId === userId);
    const uniqueLinks = new Set(userStats.map(entry => entry.discordLink));
    const count = uniqueLinks.size;

    return `<@${cleanString(userId)}> - ${count}`;
}

function cleanString(input) {
    return input.replace(/[^ -~]+/g, "").trim();
}
