import { app } from "../slack/bolt";
import { Config } from "../config";
import { t } from "../util/transcript";

app.event('member_joined_channel', async ({ event, client }) => {
    if (event.channel !== Config.CAFE_CHANNEL) { return; }

    await client.chat.postEphemeral({
        channel: event.channel,
        user: event.user,
        text: t('joined_channel'),
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": t('joined_channel')
                }
            },
            {
                "type": "image",
                "image_url": "https://cloud-1u362wm6h-hack-club-bot.vercel.app/0image.png",
                "alt_text": "cafe flow diagram"
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": t('tip')
                    }
                ]
            }
        ]
    });

    try {
        // add them to cafe-bulletin
        await client.conversations.invite({
            channel: Config.BULLETIN_CHANNEL,
            users: event.user
        });
    } catch (e) {
        console.error(e);
    }
});