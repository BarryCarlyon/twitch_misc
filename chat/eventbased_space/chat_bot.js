require('dotenv').config()

const path = require('path');
const ChatBot = require(path.join(process.env.PWD, 'chat_template.js'));

try {
    bot = new ChatBot({
        access_token: process.env.access_token,

        channels: process.env.channels.split(',')
    });
} catch (err) {
    console.log(err);
}
bot.on('opened', () => {
    console.log('opened');
});
bot.on('join', (j) => {
    console.log('join', j);
    console.error('Connected to Channel');
});
bot.on('close', () => {
    console.log('close');
    console.error('Connection Lost/DCed');
});

bot.on('notice', (n) => {
    console.log('NOTICE', n);

    if (n.params[1].toLowerCase() == 'login unsuccessful') {
        process.exit();
    }
});

bot.on('privmsg', (payload) => {
    //console.log('Recv', payload.tags.emotes);
    //console.log('Recv', payload);
    //console.log('Recv', payload.tags.emotes);
});

bot.connect();
