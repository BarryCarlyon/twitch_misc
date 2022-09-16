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

let my_command_prefix = '!';
bot.on('privmsg', (payload) => {
    let [ channel, message ] = payload.params;
    let message_id = payload.tags.id;

    if (message.startsWith(my_command_prefix)) {
        let [ command_word, word_two ] = message.split(' ', 2);
        console.log(command_word, word_two);

        switch (command_word) {
            case '!dice':
                let n = Math.floor(Math.random() * 6) + 1;
                bot.send(channel, `The number ${n} has been rolled`);
                return;
            case '!word':
                bot.reply(channel, message_id, `You said: ${word_two}`);
                return;
        }
    }
});

bot.connect();
