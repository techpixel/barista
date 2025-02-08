// to kick someone from a huddle, remove then add them to the channel

import { Config } from '../config';
import { app } from './bolt';

export default async function huddleKick(slackId: string) {
    try {
        await app.client.conversations.kick({
            token: process.env.SLACK_USER_TOKEN,
            channel: Config.CAFE_CHANNEL,
            user: slackId
        });

        setTimeout(async () => {
            await app.client.conversations.invite({
                token: process.env.SLACK_USER_TOKEN,
                channel: Config.CAFE_CHANNEL,
                users: slackId
            });
        }, 5000);
    } catch (e) {
        console.error(e);
    }
}
