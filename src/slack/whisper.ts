import type { AnyBlock } from "@slack/types";
import { Config } from "../config";
import { app } from "./bolt"; 
import { t } from "../util/transcript";

export async function whisper(args: {
    user: string,
    text: string,
    channel?: string,
    header?: string
}) {
    const blocks: AnyBlock[] = [
        {
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": `_psst..._ <@${args.user}>`
				}
			]
		},
    ];

    if (args.header) {
        blocks.push(
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": args.header
			}
		},
		{
			"type": "divider"
		});
    }

    blocks.push({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": args.text
        }
    }, {
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": t('tip')
            }
        ]
    },);

    await app.client.chat.postEphemeral({
        channel: args.channel || Config.CAFE_CHANNEL,
        user: args.user,
        text: args.text,
        blocks
    });
}