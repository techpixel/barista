import { app } from "../slack/bolt";

app.event('app_mention', async ({ event, client }) => {
    try {
        await client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: 'hyper-dino-wave'
        });
    } catch (error) {
        console.error(error);
    }
});