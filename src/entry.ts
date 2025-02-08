import dotenv from 'dotenv';
dotenv.config();

import { app } from './slack/bolt';

import './events/huddles';
import './events/message';
import './events/memberJoinedChannel';

// import './commands/my-call';
import './commands/kick';

await app.start(process.env.PORT || 3000).then(() => {
    console.log('⚡️ Bolt app is running!');
});