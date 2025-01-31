import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the bot with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Discord Bot Token from the .env file
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// When the bot is ready, log its server information and permissions
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  checkServerPermissions();
});

// Function to check the bot's permissions and server details
async function checkServerPermissions() {
  const guilds = client.guilds.cache;

  console.log(`The bot is in ${guilds.size} servers:`);

  // Loop through each guild (server) the bot is part of
  guilds.forEach(async (guild) => {
    console.log(`\nChecking permissions in server: ${guild.name} (ID: ${guild.id})`);
    
    // Get the bot's member object in the server
    const botMember = await guild.members.fetch(client.user.id);

    // Get the bot's permissions in the server
    const permissions = botMember.permissions.toArray();

    console.log(`Permissions in "${guild.name}":`);
    console.log(permissions.join(', ') || 'No specific permissions assigned.');

    // Optionally, you can check if the bot is an administrator (admin)
    if (permissions.includes('ADMINISTRATOR')) {
      console.log('Bot has Administrator permissions!');
    } else {
      console.log('Bot does not have Administrator permissions.');
    }
  });
}

// Login to Discord with the bot token
client.login(DISCORD_BOT_TOKEN);
