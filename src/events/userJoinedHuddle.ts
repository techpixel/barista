import { prisma } from "../util/prisma";
import { app, mirrorMessage } from "../util/bolt";
import type { Huddle } from "../util/bolt";
import { config, t } from "../util/transcript";

import createSession from '../sessions/create';
import unpause from "../sessions/unpause";

/*

User joins call -> bot asks & user posts goal/scrap -> start a new session

User rejoins call -> unpauses session

*/

export default async (args: {
    slackId: string,
    huddle: Huddle
}) => {
    mirrorMessage({
        message: `${args.slackId} joined the huddle`,
        user: args.slackId,
        channel: args.huddle.channel_id,
        type: 'huddle_join'
    });

    // Look if the user has a session that is paused
    const session = await prisma.session.findFirst({
        where: {
            slackId: args.slackId,
            paused: true,
            leftAt: null
        }
    });

    if (session) {
        // Unpause the session
        unpause(session);

        console.log(`user rejoined call. unpaused session`)

        return;
    }

    /*

    Preemptively create a session for the user joining the huddle. This is how we will track the user as they progress through the flow

    */

    createSession({
        slackId: args.slackId,
        callId: args.huddle.call_id
    });

    console.log(`user joined call`)

    await app.client.chat.postEphemeral({
        channel: args.huddle.channel_id,
        user: args.slackId,
        text: t('huddle_join')
    });

    console.log(`bot asked what they're working on`)

    // --> message.ts
}