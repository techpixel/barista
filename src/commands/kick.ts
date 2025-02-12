import { Config } from "../config";
import { app } from "../slack/bolt";
import huddleKick from "../slack/huddleKick";
import { mirrorMessage } from "../slack/logger";
import { prisma } from "../util/prisma";

app.command('/kick-from-call', async ({ ack, payload }) => {
    await ack();

    if (payload.user_id !== 'U04QD71QWS0') {
        return;
    }

    await mirrorMessage({
        message: 'user ran `/kick-from-call`',
        user: payload.user_id,
        channel: payload.channel_id,
        type: 'slash-command'
    })

    try {
        console.log(`/kick-from-call command received from ${payload.user_id} in ${payload.channel_id}`);

        const args = payload.text.split(" ");

        console.log(`args: ${args}`);

        if (args.length !== 1) {
            return;
        }

        // extract from <@U1234|user>
        let slackId = args[0].replace(/<@|>/g, '');

        // remove the pipe and anything after it
        const pipeIndex = slackId.indexOf('|');
        if (pipeIndex !== -1) {
            slackId = slackId.substring(0, pipeIndex);
        }

        console.log(`slackId: ${slackId}`)

        if (!slackId) {
            return;
        }

        huddleKick(slackId);

        await app.client.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: `Kicked ${slackId} from the call`
        });

    } catch (e) {
        console.error(e);
    }
});