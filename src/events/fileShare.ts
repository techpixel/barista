import { app } from "../util/bolt";
import { config } from "../util/transcript";

app.event('file_shared', async ({ event, client }) => {
    if (event.channel_id !== config.CAFE_CHANNEL) { return; }

    console.log("Recieved file_shared event");

    const file = await client.files.info({
        file: event.file_id
    });

    console.log(file);
});


