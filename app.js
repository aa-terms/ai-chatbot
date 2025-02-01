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
  }// Import required libraries
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

// Memory storage for AI context (conversation history)
const conversationMemory = new Map();

// Function to call Cloudflare AI for text responses
async function getAIResponse(userId, prompt, role) {
  try {
    const messages = [{ role: 'system', content: role }];
    
    // Add user’s conversation history for better context
    if (conversationMemory.has(userId)) {
      messages.push(...conversationMemory.get(userId));
    }
    
    messages.push({ role: 'user', content: prompt });

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

    // Save latest conversation
    conversationMemory.set(userId, messages.slice(-5));

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
      return Buffer.from(result.result.image, 'base64'); // Decode Base64 image
    }
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Function to send "Typing..." periodically if AI response takes long
async function sendTypingIndicator(channel) {
  const interval = setInterval(() => {
    channel.sendTyping();
  }, 4000); // Every 4 seconds

  return interval;
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
  const userId = interaction.user.id;
  
  await interaction.deferReply(); // Show "Thinking..." indicator

  if (commandName === 'ask') {
    const query = options.getString('query');
    const response = await getAIResponse(userId, query, 'You are a friendly AI assistant.');
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
    const response = await getAIResponse(userId, 'Bully me!', 'You are a playful and teasing bully. Respond with witty insults.');
    await interaction.editReply(response);
  }

  if (commandName === 'love') {
    const response = await getAIResponse(userId, 'Flirt with me!', 'You are a romantic AI. Respond with charm and intimacy.');
    await interaction.editReply(response);
  }

  if (commandName === 'joke') {
    const response = await getAIResponse(userId, 'Tell me a joke!', 'You are a funny AI. Tell a short joke.');
    await interaction.editReply(response);
  }
});

// Auto-reactions for AI responses
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Auto-react with emojis
  if (message.content.includes('love')) message.react('❤️');
  if (message.content.includes('joke')) message.react('😂');
  if (message.content.includes('help')) message.react('🤖');
  if (message.content.includes('angry')) message.react('😡');
  if (message.content.includes('wow')) message.react('😲');
  if (message.content.includes('sad')) message.react('😢');
  if (message.content.includes('cool')) message.react('😎');
  if (message.content.includes('thanks')) message.react('🙏');
  if (message.content.includes('win')) message.react('🏆');
  if (message.content.includes('party')) message.react('🎉');
  if (message.content.includes('fire')) message.react('🔥');
  if (message.content.includes('music')) message.react('🎵');
  if (message.content.includes('food')) message.react('🍕');
  if (message.content.includes('money')) message.react('💰');
  if (message.content.includes('study')) message.react('📖');
  if (message.content.includes('coffee')) message.react('☕');
  if (message.content.includes('gift')) message.react('🎁');
  if (message.content.includes('rain')) message.react('🌧️');
  if (message.content.includes('star')) message.react('⭐');
  if (message.content.includes('robot')) message.react('🤖');
  if (message.content.includes('sleep')) message.react('😴');
  if (message.content.includes('danger')) message.react('⚠️');
  if (message.content.includes('secret')) message.react('🤫');
  if (message.content.includes('pain')) message.react('💔');
  if (message.content.includes('game')) message.react('🎮');
  if (message.content.includes('earth')) message.react('🌍');
  if (message.content.includes('moon')) message.react('🌙');
  if (message.content.includes('sun')) message.react('☀️');
  if (message.content.includes('clown')) message.react('🤡');
  if (message.content.includes('skull')) message.react('💀');

  // Auto-replies to meaningful messages
  const lowerCaseMessage = message.content.toLowerCase();
  if (lowerCaseMessage.includes('who are you')) {
    message.reply("I'm Aqua, your friendly anime AI! 🤖💙");
  } else if (lowerCaseMessage.includes('tell me a joke')) {
    message.reply("Why don’t skeletons fight each other? They don’t have the guts! 💀😂");
  } else if (lowerCaseMessage.includes('how are you')) {
    message.reply("I'm just a bot, but I'm feeling great! What about you? 😊");
  } else if (lowerCaseMessage.includes('good morning')) {
    message.reply("Good morning! ☀️ Hope you have a fantastic day ahead! 🌸");
  } else if (lowerCaseMessage.includes('good night')) {
    message.reply("Good night! 🌙 Sleep well and dream big! 😴");
  } else if (lowerCaseMessage.includes('what can you do')) {
    message.reply("I can react to messages, chat with you, and make your day more fun! 🎉 Ask me anything! 😃");
  } else if (lowerCaseMessage.includes('are you real')) {
    message.reply("As real as your WiFi connection! 😉");
  } else if (lowerCaseMessage.includes('do you like anime')) {
    message.reply("Of course! I'm an anime AI! 🎌✨ What’s your favorite anime?");
  } else if (lowerCaseMessage.includes('what is the meaning of life')) {
    message.reply("42! Or maybe just enjoy every moment. 😊");
  } else if (lowerCaseMessage.includes('thank you')) {
    message.reply("You're welcome! 💙 Always happy to help!");
  } else if (lowerCaseMessage.includes('are you smart')) {
    message.reply("I like to think so! 😎 But you're the real genius here! 🧠✨");
  } else if (lowerCaseMessage.includes('sing a song')) {
    message.reply("🎶 La la la~! I'm not the best singer, but I try! 🎤😆");
  } else if (lowerCaseMessage.includes('do you sleep')) {
    message.reply("Nope! I'm always here to chat with you! 🤖💙");

  // AI Response when bot is mentioned
  } else if (message.mentions.has(client.user) || /\bAqua\b/i.test(message.content)) {
    const typingInterval = await sendTypingIndicator(message.channel);
    const response = await getAIResponse(message.author.id, message.content, 'You are a helpful anime AI.');
    clearInterval(typingInterval);
    message.reply(response);
  }
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN);


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
