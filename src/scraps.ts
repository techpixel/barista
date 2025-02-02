import { app } from "./bolt";

app.event('file_shared', async ({ event, client }) => {
    if (event.channel_id !== process.env.CAFE_CHANNEL) { return; }

    console.log("Recieved file_shared event");

    const file = await client.files.info({
        file: event.file_id
    });

    console.log(file);
});


