// test huddles

import { app } from "../slack/bolt";
import huddleInfo from "../slack/huddleInfo";
import { mirrorMessage } from "../slack/logger";

app.command('/test-huddles', async ({ ack, payload }) => {
    await ack();

    const huddleData = await huddleInfo();

    await app.client.chat.postEphemeral({
        channel: payload.channel_id,
        user: payload.user_id,
        text: JSON.stringify(huddleData, null, 2)
    });
})