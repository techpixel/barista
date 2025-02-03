import { prisma } from "../util/prisma";
import { app } from "../util/bolt";
import type { Huddle } from "../util/bolt";
import { config, t } from "../util/transcript";

export default async (args: {
    slackId: string,
    huddle: Huddle
}) => {
    /*

    Preemptively create a session for the user joining the huddle. This is how we will track the user as they progress through the flow

    */
    await prisma.session.create({
        data: {
            user: { connect: { slackId: args.slackId } },
            callId: args.huddle.call_id,
            joinedAt: new Date(),
        }
    });

    await app.client.chat.postEphemeral({
        channel: args.huddle.channel_id,
        user: args.slackId,
        text: t('huddle_join')
    });
}