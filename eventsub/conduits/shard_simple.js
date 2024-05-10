import { Twitch, eventsubSocket } from './eventsub.js'

let twitch;

try {
    twitch = new Twitch({
        token: process.env.TWITCH_ACCESS_TOKEN,

        conduit_id: process.env.TWITCH_CONDUIT_ID,
        shard_id: process.env.TWITCH_SHARD_ID
    });

    twitch.once('validated', (dat) => {
        console.log('Once Token Validated', dat);

        // validate the conduit exists
        twitch.findConduit();
    });

    twitch.once('conduitFound', () => {
        // lets spawn a WebSocket and assign this socket to a shard
        // if we are a ID of auto then the shard ID is forced to 0 if we created...
        let mySocket = new eventsubSocket(true);
        mySocket.on('connected', async (session_id) => {
            console.log(`Socket has conneted ${session_id} with assigned as ${process.env.TWITCH_SHARD_ID} for ${process.env.TWITCH_CONDUIT_ID}`);
            twitch.setSessionID(session_id);
            twitch.updateShard();
        });

        mySocket.on('notification', ({ metadata, payload }) => {
            // do stuff with the data
        });

    });

} catch (e) {
    console.error(e.message);
    process.exit();
}
