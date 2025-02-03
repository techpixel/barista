import { prisma } from "../util/prisma";
import { app, mirrorMessage } from "../util/bolt";
import type { Huddle } from "../util/bolt";
import { config } from "../util/transcript";

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

    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            state: 'WAITING_FOR_FINAL_SCRAP',
            leftAt: new Date(),
            paused: true
        }
    });

    console.log(`user left call. paused session`)
    console.log(`waiting for final scrap or for the user to rejoin the call`)

    await app.client.chat.postEphemeral({
        channel: config.CAFE_CHANNEL,
        user: args.slackId,
        text: `You left the huddle without posting a scrap. If you want your time to count, please post a scrap. Or come back in 30 minutes to resume the timer. placeholder`
    })
}