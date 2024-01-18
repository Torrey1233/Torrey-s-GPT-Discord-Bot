// Torrey's GPT Discord Bot
// I've created a discord bot that encorporates OpenAI.
// It's basically ChatGPT but for discord

// Importing Dependencies
require('dotenv/config'); // Load environment variables
// Importing discord.js library 
const { Client } = require('discord.js');
// Importing OpenAI library for it's AI functionality
const { OpenAI } = require('openai');

// Creating Discord client
const bot = new Client({
  intents: ['Guilds', 'GuildMessages', 'MessageContent'],
});

// Event to confirm that the bot is working
bot.on('ready', () => {
    // Appear on the terminal when bot is working
    console.log('The bot is online!');
});

// Prefix that lets the bot will only respond to
// Ex) "!generate a paragraph on frogs"
const ACTIVATE_PREFIX = "!";
// The discord channel id for the bot to interact in
const CHANNELS = ['1196624194549596161', '1170445374255796354'];

// Configuring OpenAI
const openai = new OpenAI({
    // OpenAI key for accessing OpenAI capabilities
    apiKey: process.env.API_KEY,
});

// Message Creating Event
bot.on('messageCreate', async (message) => {
    // Conditions the bot should not respond to
    // Do not respond to other bot messages
    if (message.author.bot) return;
    // Do not respond to messages that aren't in the specified channels
    // Comment out if needed in other channels of a server
    //if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(bot.user.id)) return;

    // Only works when the prefix is used
    if (message.content.startsWith(ACTIVATE_PREFIX)){
        // Shows the typing icon when the bot is generating the message to simulate the generating
        await message.channel.sendTyping();

        // interval for the tpying indicator to occur
        const sendTypingInterval = setInterval(() => {
            message.channel.sendTyping();
            // 5 seconds
        }, 5000);

        // Creating a conversation for the OpenAI input
        let conversation = [];
        conversation.push({
            role: 'system',
            // Telling the AI what was previously said by the user so it can respond appropriatly
            content: `User said: "${message.content}"`
        });
        
        // Fetch previous 10 messages in the channel
        let prevMessages = await message.channel.messages.fetch({ limit: 10});
        // Reverse to read it chronologically
        prevMessages.reverse();

        // Iterates through each message
        prevMessages.forEach((msg) => {
            // Checks if the user that sent it is a bot
            // If so do nothing
            if (msg.author.bot && msg.author.id != bot.user.id) return;
            
            // Creates a modified username for the message user replacing spaces with "_" and removing non-alphanumeric characters
            const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

            // If the message user was a bot it sets it to have an "assistant role"
            if (msg.author.id === bot.user.id) {
                conversation.push({
                    role: 'assistant',
                    name: username,
                    content: msg.content,
                })
                // Does nothing
                return;
            }

            // Sets the message user a "user" id
            conversation.push({
                role: 'user', 
                name: username,
                content: msg.content,
            });
        });

        // Generates a response using OpenAI
        const response = await openai.chat.completions
            .create({
                // which OpenAI model
                model: 'gpt-3.5-turbo',
                messages: conversation,
        })
        // If something goes wrong, show this message in the terminal
        .catch((error) => console.error('OpenAI Error:\n', error));

        // Clears the tpying indicator interval
        clearInterval(sendTypingInterval);
        // If API is having errors
        // Ex) processing too many responses in different channels and servers
        if(!response){
            message.reply("Having issues with OpenAI API right now. Please try again later.");
            return;
        }

        // Retrieving the options of which response to use
        // Choose the first one which is probably the most effective response
        const outputMessage = response.choices[0].message.content;
        // Limiting message size to 2000 characters
        const segmentSizeLimit = 2000;
        // Iterates through to process and send the message in segments
        for (let i = 0; i < outputMessage.length; i+= segmentSizeLimit){
            const segment = outputMessage.substring(i, i + segmentSizeLimit);

            await message.reply(segment);
        }
    
}
});
// Logging into the discord bot with the bot token
bot.login(process.env.TOKEN);