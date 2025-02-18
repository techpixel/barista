import { prisma } from "../util/prisma";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import type { Huddle } from "../slack/huddleInfo";
import { t } from "../util/transcript";
import { Config } from "../config";

/*

User leaves call -> bot reminds user to ship

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

    await app.client.chat.postEphemeral({
        channel: Config.CAFE_CHANNEL,
        user: args.slackId,
        text: t('huddle_left', {
            slackId: args.slackId
        })
    })
}