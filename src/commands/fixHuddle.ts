import { app } from "../slack/bolt";
import huddleInfo, { grabActiveHuddle, grabAllMembers } from "../slack/huddleInfo"; 
import { upsertUser } from "../util/db";
import { prisma } from "../util/prisma";
import userJoinedHuddle from "../events/userJoinedHuddle";
import userLeftHuddle from "../events/userLeftHuddle";
import { whisper } from "../slack/whisper";
import { mirrorMessage } from "../slack/logger";

// pretty much manually trigger the event

app.command('/fix-huddle', async ({ ack, payload }) => {
    await ack();

    await mirrorMessage({
        message: 'user ran `/fix-huddle`',
        user: payload.user_id,
        channel: payload.channel_id,
        type: 'slash-command'
    })
    console.log("Recieved huddle update event");

    // Get huddle info
    const huddleRaw = (await huddleInfo());
    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }

    // const active_members = grabAllMembers(huddleRaw.huddles);
    const active_huddle = grabActiveHuddle(huddleRaw.huddles);

    if (!active_huddle) {
        await whisper({
            user: payload.user_id,
            text: "something went wrong: there is no active huddle",
        });

        return;
    }

    const active_members = active_huddle.active_members;

    const inHuddle = active_members.includes(payload.user.id);

    const user = await upsertUser(payload.user.id, inHuddle);

    console.log(`User ${payload.user.id} is in huddle: ${inHuddle}`);

    if (!user) {
        await whisper({
            user: payload.user_id,
            text: "something went wrong: user record not found ;-;",
        });

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

        await whisper({
            user: payload.user_id,
            text: "registered a huddle join event!",
        })

        userJoinedHuddle({ 
            slackId: payload.user.id,
            huddle: active_huddle
        });

        return;
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

        await whisper({
            user: payload.user_id,
            text: "registered a huddle leave event!",
        })

        userLeftHuddle({ 
            slackId: payload.user.id,
            huddle: active_huddle
        });

        return;
    }

    await whisper({
        user: payload.user_id,
        text: "just went through and checked your huddle status. everything seems to be in order!",
    })
});
