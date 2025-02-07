// to kick someone from a huddle, remove then add them to the channel

import { config } from '../util/transcript';
import { app } from './bolt';

export default async function huddleKick(slackId: string) {
    try {
        await app.client.conversations.kick({
            channel: config.CAFE_CHANNEL,
            user: slackId
        });

        await app.client.conversations.invite({
            channel: config.CAFE_CHANNEL,
            users: slackId
        });
    } catch (e) {
        console.error(e);
    }
}
