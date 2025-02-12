import { app } from "./bolt"; 

export async function sendDM(args: {
    user: string,
    text: string
}) {
    await app.client.chat.postMessage({
        channel: args.user,
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