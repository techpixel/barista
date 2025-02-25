import type { AnyBlock } from "@slack/types";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import { whisper } from "../slack/whisper";
import { prisma } from "../util/prisma";

/*

pretty much show what everyone is working on

*/

app.command('/board', async ({ ack, payload }) => {
    await ack();

    await mirrorMessage({
        message: 'user ran `/board`',
        user: payload.user_id,
        channel: payload.channel_id,
        type: 'slash-command'
    })

    const sessions = await prisma.session.findMany({
        where: {
            state: {
                notIn: ['COMPLETED', 'CANCELLED']
            }
        },
        include: {
            scraps: {
                where: {
                    state: 'INITIAL'
                },
                take: 1
            }
        }
    });

    if (sessions.length === 0) {
        await whisper({
            user: payload.user_id,
            text: `seems like no one is in a session rn. you should start one!`
        });
    }

    let blocks: AnyBlock[] = [{
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": "_psssst..._"
            }
        ]
    },
    {
        "type": "header",
        "text": {
            "type": "plain_text",
            "text": "The Board!",
            "emoji": true
        }
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "take a look at what everyone is working on!"
        }
    },
    {
        "type": "divider"
    }];

    for (const session of sessions) {
        if (session.scraps.length === 0) {
            continue;
        }

        blocks.push({
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `• <@${session.slackId}>: \`${session.scraps[0].text}!\``
			}
		});
    }

    await app.client.chat.postEphemeral({
        token: process.env.SLACK_BOT_TOKEN,
        channel: payload.channel_id,
        user: payload.user_id,
        blocks
    })
});