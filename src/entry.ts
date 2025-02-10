import dotenv from 'dotenv';
dotenv.config();

import { app } from './slack/bolt';

import './events/huddles';
import './events/message';
import './events/memberJoinedChannel';
import './events/appMention';

import './commands/myCups';
import './commands/kick';
import './commands/yap';

import { Config } from './config';

await app.start(process.env.PORT || 3000).then(() => {
    console.log('⚡️ Bolt app is running!');

    app.client.chat.postMessage({
        channel: Config.LOGS_CHANNEL,
        text: 'Hello world!'
    });
});