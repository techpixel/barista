import type { AnyBlock } from "@slack/types";
import { Config } from "../config";
import { app } from "./bolt"; 

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
					"text": "_psst..._"
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
    });

    await app.client.chat.postEphemeral({
        channel: args.channel || Config.CAFE_CHANNEL,
        user: args.user,
        text: args.text,
        blocks: [
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "_psst..._"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": args.text
                }
            }            
        ]
    });
}