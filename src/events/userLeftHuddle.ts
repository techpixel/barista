import { prisma } from "../util/prisma";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import type { Huddle } from "../slack/huddleInfo";
import { t } from "../util/transcript";
import { Config } from "../config";

/*

User leaves call -> bot pauses session & asks for final ship -> mark session as complete and record time

*/

export default async (args: {
    slackId: string,
    huddle: Huddle
}) => {
    mirrorMessage({
        message: `${args.slackId} left the huddle`,
        user: args.slackId,
        channel: args.huddle.channel_id,
        type: 'huddle_left'
    });    

    // check if user hasn’t already posted ship + finished while in the call
    const session = await prisma.session.findFirst({
        where: {
            slackId: args.slackId,
            state: 'SESSION_PENDING'
        }
    });

    if (!session) { return; }

    const now = new Date();
    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            state: 'WAITING_FOR_FINAL_SCRAP',
            leftAt: new Date(),
            lastUpdate: now,
            elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime()),
            paused: true
        }
    });

    console.log(`user left call. paused session`)
    console.log(`waiting for final scrap or for the user to rejoin the call`)

    await app.client.chat.postEphemeral({
        channel: Config.CAFE_CHANNEL,
        user: args.slackId,
        text: t('huddle_left', {
            slackId: args.slackId
        })
    })
}