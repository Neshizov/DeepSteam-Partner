require('dotenv').config({ path: './Config/Config.env' });
const fs = require('fs');
const path = require('path');
const { Client, Intents, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'Functions');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    if (file === 'part.js') continue; // Исключение для part.js, который следит за чатом
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.warn(`Команда ${filePath} не загрузилась.`);
    }
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Загружаем команды.');

        await rest.put(
            Routes.applicationCommands(process.env.APPLICATION_ID),
            { body: commands },
        );

        console.log('Успешно загрузили команды.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`Вошли как ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Произошла ошибка при выполнении команды!', ephemeral: true });
    }
});

const { monitorChannel } = require('./Functions/part');
client.once('ready', () => {
    monitorChannel(client);
});

client.login(process.env.TOKEN);
