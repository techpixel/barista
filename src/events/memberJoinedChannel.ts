import { app } from "../slack/bolt";
import { Config } from "../config";
import { t } from "../util/transcript";

app.event('member_joined_channel', async ({ event, client }) => {
    if (event.channel !== Config.CAFE_CHANNEL) { return; }

    await client.chat.postEphemeral({
        channel: event.channel,
        user: event.user,
        text: t('joined_channel')
    });
});