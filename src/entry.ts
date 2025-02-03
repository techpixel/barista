import dotenv from 'dotenv';
dotenv.config();

import { app } from './util/bolt';

import './events/huddles';
import './events/message';

import './commands/my-call';

app.start(process.env.PORT || 3000).then(() => {
    console.log('⚡️ Bolt app is running!');
});