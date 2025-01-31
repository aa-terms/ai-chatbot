import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const logFile = path.join(__dirname, "server_logs.txt");

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ],
});

const logEvent = (log) => {
    const logEntry = `${new Date().toLocaleString()} | ${log.type} | ${log.user} | ${log.channel || "N/A"} | ${log.content || "N/A"} | ${log.oldContent || ""} -> ${log.newContent || ""}\n`;
    console.log(logEntry);
    fs.appendFileSync(logFile, logEntry);
};

bot.on("ready", () => {
    console.log(`${bot.user.tag} is online and logging events.`);
});

bot.on("messageCreate", (message) => {
    if (!message.author.bot) {
        logEvent({
            type: "Message Sent",
            user: message.author.tag,
            content: message.content,
            channel: message.channel.name,
        });
    }
});

bot.on("messageUpdate", (oldMessage, newMessage) => {
    if (!oldMessage.author.bot) {
        logEvent({
            type: "Message Edited",
            user: oldMessage.author.tag,
            oldContent: oldMessage.content,
            newContent: newMessage.content,
            channel: oldMessage.channel.name,
        });
    }
});

bot.on("messageDelete", (message) => {
    if (!message.author.bot) {
        logEvent({
            type: "Message Deleted",
            user: message.author.tag,
            content: message.content,
            channel: message.channel.name,
        });
    }
});

bot.on("presenceUpdate", (oldPresence, newPresence) => {
    const user = newPresence.user.tag;
    const oldStatus = oldPresence?.status || "Unknown";
    const newStatus = newPresence?.status || "Unknown";
    const activity = newPresence.activities.length > 0 ? newPresence.activities[0].name : "None";
    
    logEvent({
        type: "User Status Update",
        user,
        content: `Status: ${oldStatus} -> ${newStatus}, Activity: ${activity}`,
    });
});

app.get("/logs", (req, res) => {
    fs.readFile(logFile, "utf8", (err, data) => {
        if (err) {
            res.status(500).send("Error reading log file");
            return;
        }
        res.send(`
            <html>
                <head>
                    <title>Discord Server Logs</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #fff; }
                        .log-container { max-width: 900px; margin: auto; }
                        .log { background: #252525; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 0 5px rgba(255, 255, 255, 0.2); }
                        h2 { text-align: center; color: #00aaff; }
                        pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="log-container">
                        <h2>📜 Discord Server Logs</h2>
                        <pre class="log">${data}</pre>
                    </div>
                </body>
            </html>
        `);
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Log server running at http://0.0.0.0:${port}`);
});

bot.login(process.env.DISCORD_BOT_TOKEN);