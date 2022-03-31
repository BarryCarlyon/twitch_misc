const path = require('path');

const ChatBot = require(path.join(process.env.PWD, 'chatbot_template.js'));

try {
    bot = new ChatBot();
} catch (err) {
    console.log(err);
}
bot.on('open', () => {
    console.log('opening');
    bot.login('justinfan123', 'asdasdasdasd', [
        'barrycarlyon'
    ]);
    // using a user account
    // the library will add the oauth: prefix
    bot.login('someusername', 'someuserstoken', [
        'barrycarlyon'
    ]);
});
bot.on('join', (j) => {
    console.log('join', j);
    console.error('Connected to Channel');
});
bot.on('close', () => {
    console.log('close');
    console.error('Connection Lost/DCed');
});

bot.on('privmsg', (payload) => {
    //console.log('Recv', payload.tags.emotes);
    console.log('Recv', payload.message);
});

bot.connect();
