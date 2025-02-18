import { prisma } from "../util/prisma";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import type { Huddle } from "../slack/huddleInfo";
import { t } from "../util/transcript";
import { Config } from "../config";

import createSession from '../oldsessions/create';
import unpause from "../oldsessions/unpause";
import isPaused from "../oldsessions/isPaused";
import { isItTime } from "../isItTime";

/*

User joins call -> bot asks user to post goal/scrap

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

    await app.client.chat.postEphemeral({
        channel: args.huddle.channel_id,
        user: args.slackId,
        text: t('huddle_join')
    });

    console.log(`bot asked what they're working on`)
}