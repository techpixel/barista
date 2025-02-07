// to kick someone from a huddle, remove then add them to the channel

import { Config } from '../config';
import { app } from './bolt';

export default async function huddleKick(slackId: string) {
    try {
        await app.client.conversations.kick({
            channel: Config.CAFE_CHANNEL,
            user: slackId
        });

        await app.client.conversations.invite({
            channel: Config.CAFE_CHANNEL,
            users: slackId
        });
    } catch (e) {
        console.error(e);
    }
}
