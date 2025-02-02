import dotenv from 'dotenv';
dotenv.config();

import { app } from "./bolt";
import { prisma } from './prisma';

import { huddleInfo } from "./huddles";

app.event('user_huddle_changed', async ({ payload }) => {
    console.log("Recieved huddle update event");

    const huddleRaw = (await huddleInfo());

    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }

    const huddle = huddleRaw.huddles[0];

    const user = await prisma.user.upsert({
        where: { slackId: payload.user.id },
        update: {},
        create: { slackId: payload.user.id },
        include: {
            calls: {
                where: {
                    inCall: true
                }
            }
        }
    });

    const recentHuddle = user.calls[0];
    const inHuddle = huddle.active_members.includes(payload.user.id);

    // if there is no recent huddle but the user joined the huddle, create a new call
    if (!recentHuddle && inHuddle) {
        await prisma.call.create({
            data: {
                user: { connect: { slackId: payload.user.id } },
                inCall: true,
                joinedAt: new Date(),
                callId: huddle.call_id
            }
        });

        await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: "C08B55UP0T0",
            text: `<@${user.slackId}> joined the huddle! There are ${huddle.active_members.length} other people.`
        });
    }

    // if there is a recent huddle but the user left the huddle, update the call
    if (recentHuddle && !inHuddle) {
        await prisma.call.update({
            where: { id: recentHuddle.id },
            data: {
                inCall: false,
                leftAt: new Date()
            }
        });

        const seconds = (new Date().getTime() - recentHuddle.joinedAt.getTime()) / 1000;

        await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: "C08B55UP0T0",
            text: `<@${user.slackId}> left the huddle! They were in the huddle for ${seconds} seconds.`,
        });
    }
});

app.command('/my-calls', async ({ ack, payload, context }) => {
    await ack();

    const calls = await prisma.call.findMany({
        where: {
            user: { slackId: payload.user_id }
        }
    });

    const activeCalls = calls.filter(call => call.inCall);
    const inactiveCalls = calls.filter(call => !call.inCall);

    let blocks = [
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
    ]

    activeCalls.forEach(call => {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:green_circle: Call ID: ${call.callId}`
            }
        }, {
            "type": "context",
            "text": {
                "type": "mrkdwn",
                "text": `Joined at ${call.joinedAt}`
            }
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
            "text": {
                "type": "mrkdwn",
                "text": `Joined at ${call.joinedAt} | Left at ${call.leftAt} | Duration: ${Math.floor((call.leftAt!.getTime() - call.joinedAt.getTime()) / 1000)} seconds`
            }
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