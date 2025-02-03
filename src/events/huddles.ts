import { app, huddleInfo } from "../util/bolt";

import { upsertUser } from "../util/db";
import userJoinedHuddle from "./userJoinedHuddle";
import userLeftHuddle from "./userLeftHuddle";

app.event('user_huddle_changed', async ({ payload }) => {
    console.log("Recieved huddle update event");

    // Get huddle info
    const huddleRaw = (await huddleInfo());
    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }

    const huddle = huddleRaw.huddles[0];

    const user = await upsertUser(payload.user.id);
    
    const previousHuddleStatus = user.inHuddle;
    const inHuddle = huddle.active_members.includes(payload.user.id);

    // if they weren't in the huddle before but the user joined the huddle, trigger a user joined event
    if (!previousHuddleStatus && inHuddle) {
        userJoinedHuddle({ 
            slackId: payload.user.id,
            huddle
        });
    } 

    // if they were in the huddle but the user left the huddle, update the call
    if (previousHuddleStatus && !inHuddle) {
        userLeftHuddle({ 
            slackId: payload.user.id,
            huddle
        });
    }
});
