import dotenv from 'dotenv';
dotenv.config();

import { app } from './util/bolt';

import './events/huddles';
import { prisma } from './util/prisma';
import type { AnyBlock } from '@slack/types';

app.command('/my-calls', async ({ ack, payload, context }) => {
    await ack();

    const calls = await prisma.call.findMany({
        where: {
            user: { slackId: payload.user_id }
        }
    });

    const activeCalls = calls.filter(call => call.inCall);
    const inactiveCalls = calls.filter(call => !call.inCall);

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

app.start(process.env.PORT || 3000).then(() => {
    console.log('⚡️ Bolt app is running!');
});