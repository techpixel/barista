import { app } from "../util/bolt";
import { prisma } from "../util/prisma";
import type { AnyBlock } from "@slack/types";

app.command('/call-time', async ({ ack, payload, context }) => {
    await ack();

    const recentSession = await prisma.session.findFirst({
        where: {
            user: { slackId: payload.user_id },
            leftAt: null
        },
        orderBy: {
            joinedAt: 'desc'
        }
    });

    if (!recentSession) { return; }

    const elapsed = recentSession.elapsed; // in milliseconds

    const hours = Math.floor(elapsed / 1000 / 60 / 60);
    const minutes = Math.floor(elapsed / 1000 / 60);
    const seconds = Math.floor(elapsed / 1000);

    let blocks: AnyBlock[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `You've been on a call for ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`
            }
        },
        {
            type: "divider"
        }
    ];    
});