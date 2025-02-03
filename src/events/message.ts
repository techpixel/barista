import { app } from "../util/bolt";
import { config } from "../util/transcript";

app.event('message', async ({ event, client }) => {
    if (event.channel !== config.CAFE_CHANNEL) { return; }

    switch (event.subtype) {
        case 'file_share':
            console.log("Recieved file_share event");
            break;
        case 'message_changed':
            console.log("Recieved message_changed event");
            break;
        case 'message_deleted':
            console.log("Recieved message_deleted event");
            break;
        default:
            console.log("Recieved message event");
            break;
    }
});


