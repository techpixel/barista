import { prisma } from "../util/prisma";
import { app } from "../util/bolt";
import type { Huddle } from "../util/bolt";
import { config } from "../util/transcript";

export default async (args: {
    slackId: string,
    huddle: Huddle
}) => {
    await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: config.CAFE_CHANNEL,
        text: `<@${args.slackId}> left the huddle! There are ${args.huddle.active_members.length} other people.`
    });    
}