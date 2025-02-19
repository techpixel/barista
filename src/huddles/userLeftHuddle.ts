import { prisma } from "../util/prisma";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import type { Huddle } from "../slack/huddleInfo";
import { t } from "../util/transcript";
import { Config } from "../config";
import { sendDM } from "../slack/dm";

/*

User leaves call -> bot reminds user to ship

*/

export default async (args: {
    slackId: string,
}) => {
    console.log(`User ${args.slackId} left the huddle`); 

    mirrorMessage({
        message: `${args.slackId} left the huddle`,
        user: args.slackId,
        channel: Config.CAFE_CHANNEL,
        type: 'huddle_left'
    });    

    sendDM({
        user: args.slackId,
        text: t('huddle_left', {
            slackId: args.slackId
        })
    })
}