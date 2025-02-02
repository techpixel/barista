import dotenv from 'dotenv';
dotenv.config();

import { app } from './bolt';

import './huddles';
import './scraps';

app.start(process.env.PORT || 3000).then(() => {
    console.log('⚡️ Bolt app is running!');
});