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

// this example will log every TMI sent message to a file
// this will not log the bots own messages
// as they are not sent back to the bot
// if you want to _also_ log the bot then run an anonomous second instance
// connected to the same channel
bot.on('raw', (line) => {
    fs.appendFileSync(path.join(
        __dirname,
        'raw.log'
    ), line + "\n");
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

    let room_id = payload.tags['room-id'];
    let message_id = payload.tags.id;

    if (message.startsWith(my_command_prefix)) {
        let space = message.indexOf(' ');
        if (space == -1) {
            space = message.length;
        }

        let command_word = message.slice(0, space);
        let rest = message.slice(space + 1);
        console.log('Word, rest', command_word, rest);

        let word_two = '';

        if (rest !== undefined) {
            [ word_two ] = rest.split(' ', 1);
            console.log('Word, two', command_word, word_two);
        }

        switch (command_word) {
            case '!dice':
                let n = Math.floor(Math.random() * 6) + 1;
                bot.send(channel, `The number ${n} has been rolled`);
                return;
            case '!word':
                bot.reply(channel, message_id, `You said: ${word_two}`);
                return;
            case '!announce':
                console.log(`Trigger announcement to ${room_id}`);
                bot.send(channel, '.announce This is a test announcement COMMAND');
                bot.announcement(room_id, 'This is a test announcement API');
                break;
        }
    }
});

bot.on('raid', (payload) => {
    console.log('Got a raid', payload);

    bot.announcement(
        payload.tags['room-id'],
        `WE HAVE BEEN RAIDED BY ${payload.tags['msg-param-displayName']}`
    );
});


bot.connect();
