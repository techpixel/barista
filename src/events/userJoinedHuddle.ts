import { prisma } from "../util/prisma";
import { app, mirrorMessage } from "../util/bolt";
import type { Huddle } from "../util/bolt";
import { config, t } from "../util/transcript";

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

    /*

    Preemptively create a session for the user joining the huddle. This is how we will track the user as they progress through the flow

    */

    const now = new Date();

    await prisma.session.create({
        data: {
            user: { connect: { slackId: args.slackId } },
            callId: args.huddle.call_id,
            joinedAt: now,
            lastUpdate: now,
            state: 'WAITING_FOR_INITAL_SCRAP',
        }
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