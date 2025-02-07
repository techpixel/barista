import { app } from "../src/slack/bolt";
import { prisma } from "../src/util/prisma";
import type { AnyBlock } from "@slack/types";

app.command('/my-calls', async ({ ack, payload, context }) => {
    await ack();

    const calls = await prisma.session.findMany({
        where: {
            user: { slackId: payload.user_id }
        }
    });

    const activeCalls = calls.filter(call => call.joinedAt && !call.leftAt);
    const inactiveCalls = calls.filter(call => call.joinedAt && call.leftAt);

    let blocks: AnyBlock[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `You have been in ${activeCalls.length} active calls and ${inactiveCalls.length} inactive calls.`
            }
        },
        {
            type: "divider"
        }
    ];

    activeCalls.forEach(call => {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:large_green_circle: Call ID: ${call.callId}`
            }
        }, {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Joined at ${call.joinedAt}`
                }
            ]
        }, {
            "type": "divider"
        });
    });

    inactiveCalls.forEach(call => {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:red_circle: Call ID: ${call.callId}`
            }
        }, {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Joined at ${call.joinedAt} | Left at ${call.leftAt} | Duration: ${Math.floor((call.leftAt!.getTime() - call.joinedAt.getTime()) / 1000)} seconds`
                }
            ]
        }, {
            "type": "divider"
        });
    });

    await app.client.chat.postEphemeral({
        token: context.botToken,
        channel: payload.channel_id,
        user: payload.user_id,
        blocks
    });
});