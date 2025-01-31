// Import required libraries
import { Client, GatewayIntentBits, AttachmentBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Cloudflare AI API details for text and image generation
const CLOUDFLARE_API_URL_TEXT = "https://api.cloudflare.com/client/v4/accounts/048e21152208f8432ef4d6bf3b30d5ef/ai/run/@cf/meta/llama-3-8b-instruct";
const CLOUDFLARE_API_URL_IMAGE = "https://api.cloudflare.com/client/v4/accounts/048e21152208f8432ef4d6bf3b30d5ef/ai/run/@cf/black-forest-labs/flux-1-schnell";
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Function to call Cloudflare AI for text responses
async function getAIResponse(prompt, role) {
  try {
    const messages = [{ role: 'system', content: role }, { role: 'user', content: prompt }];

    const response = await fetch(CLOUDFLARE_API_URL_TEXT, {
      method: 'POST',
      headers: {
        Authorization: CLOUDFLARE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    const result = await response.json();
    if (!result?.result?.response) throw new Error("No AI response");
    return result.result.response;
  } catch (error) {
    console.error('Error calling Cloudflare AI:', error);
    return "Oops! My AI brain seems to be offline right now. Try again later! 🤖💙";
  }
}

// Function to call Cloudflare AI for image generation
async function generateImage(prompt) {
  try {
    const response = await fetch(CLOUDFLARE_API_URL_IMAGE, {
      method: 'POST',
      headers: {
        Authorization: CLOUDFLARE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const result = await response.json();
    if (result?.result?.image) {
      return Buffer.from(result.result.image, 'base64');
    }
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Slash commands setup
const commands = [
  new SlashCommandBuilder().setName('ask').setDescription('Ask Aqua-Chan a question').addStringOption(option =>
    option.setName('query').setDescription('Your question').setRequired(true)
  ),
  new SlashCommandBuilder().setName('image').setDescription('Generate an AI image').addStringOption(option =>
    option.setName('prompt').setDescription('Describe the image').setRequired(true)
  ),
  new SlashCommandBuilder().setName('bully').setDescription('Get a playful insult'),
  new SlashCommandBuilder().setName('love').setDescription('Get a romantic response'),
  new SlashCommandBuilder().setName('joke').setDescription('Get a funny AI-generated joke')
];

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
async function registerCommands() {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands('1331650540119003207'), { body: commands });
    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Event listener for when the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await registerCommands();
});

// Slash command handling
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;
  await interaction.deferReply();

  if (commandName === 'ask') {
    const query = options.getString('query');
    const response = await getAIResponse(query, 'You are a friendly AI assistant.');
    await interaction.editReply(response);
  }

  if (commandName === 'image') {
    const prompt = options.getString('prompt');
    const imageBuffer = await generateImage(prompt);

    if (imageBuffer) {
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'ai_image.png' });
      await interaction.editReply({ content: 'Here’s your AI-generated image:', files: [attachment] });
    } else {
      await interaction.editReply("I couldn't generate an image. Try again later!");
    }
  }

  if (commandName === 'bully') {
    const response = await getAIResponse('Bully me!', 'You are a playful and teasing bully. Respond with witty insults.');
    await interaction.editReply(response);
  }

  if (commandName === 'love') {
    const response = await getAIResponse('Flirt with me!', 'You are a romantic AI. Respond with charm and intimacy.');
    await interaction.editReply(response);
  }

  if (commandName === 'joke') {
    const response = await getAIResponse('Tell me a joke!', 'You are a funny AI. Tell a short joke.');
    await interaction.editReply(response);
  }
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN);
