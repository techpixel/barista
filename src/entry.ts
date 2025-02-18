import dotenv from 'dotenv';
dotenv.config();

import { app } from './slack/bolt';

import './events/appMention';

import './tracking/message';

// import './huddles/huddles';
// import './events/message';
// import './events/memberJoinedChannel';

// import './commands/kick';
// import './commands/hack';
// import './commands/yap';
// import './commands/myCups'; 
// import './commands/huddleInfo';
// import './commands/fixHuddle';

// import './huddlePatch';

import { Config } from './config';

await app.start(process.env.PORT || 3000).then(() => {
    console.log('⚡️ Bolt app is running!');

    app.client.chat.postMessage({
        channel: Config.LOGS_CHANNEL,
        text: 'Hello world!'
    });
});