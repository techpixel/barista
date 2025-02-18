import { prisma } from "../util/prisma";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import type { Huddle } from "../slack/huddleInfo";
import { t } from "../util/transcript";
import { Config } from "../config";

import createSession from '../sessions/create';
import unpause from "../sessions/unpause";
import isPaused from "../sessions/isPaused";
import { isItTime } from "../isItTime";

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

    if (await isItTime(args.slackId)) {
        return;
    } 

    // Look if the user has a session that is paused
    // Make sure it's not completed or cancelled
    const session = await prisma.session.findFirst({
        where: {
            slackId: args.slackId,
            state: {
                notIn: ['COMPLETED', 'CANCELLED']
            }
        }
    });

    console.log(`user ${args.slackId} joined call`);

    if (session) {
        if (isPaused(session)) {
            // Unpause the session
            unpause(session);

            console.log(`user rejoined call. unpaused session`)
        }

        // if a session already exists and a huddle join fires, ignore it
        // this is to prevent the bot from asking the user what they're working on again

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