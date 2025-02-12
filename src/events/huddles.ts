import { app } from "../slack/bolt";
import huddleInfo, { grabActiveHuddle, grabAllMembers } from "../slack/huddleInfo"; 
import { upsertUser } from "../util/db";
import { prisma } from "../util/prisma";
import userJoinedHuddle from "./userJoinedHuddle";
import userLeftHuddle from "./userLeftHuddle";

app.event('user_huddle_changed', async ({ payload }) => {
    console.log("Recieved huddle update event");

    // Get huddle info
    const huddleRaw = (await huddleInfo());
    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }

    const active_huddle = grabActiveHuddle(huddleRaw.huddles);

    if (!active_huddle) {
        return;
    }

    const active_members = active_huddle.active_members;

    const inHuddle = active_members.includes(payload.user.id);

    const user = await upsertUser(payload.user.id, inHuddle);

    console.log(`User ${payload.user.id} is in huddle: ${inHuddle}`);

    if (!user) {
        return;
    }

    const previousHuddleStatus = user.inHuddle;

    // if they weren't in the huddle before but the user joined the huddle, trigger a user joined event
    if (!previousHuddleStatus && inHuddle) {
        await prisma.user.update({
            where: {
                slackId: payload.user.id
            },
            data: {
                inHuddle: true
            }
        });

        userJoinedHuddle({ 
            slackId: payload.user.id,
            huddle: active_huddle
        });
    } 

    // if they were in the huddle but the user left the huddle, update the call
    if (previousHuddleStatus && !inHuddle) {
        await prisma.user.update({
            where: {
                slackId: payload.user.id
            },
            data: {
                inHuddle: false
            }
        });

        userLeftHuddle({ 
            slackId: payload.user.id,
            huddle: active_huddle
        });
    }
});
