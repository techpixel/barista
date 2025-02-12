import { app } from "../slack/bolt";
import huddleInfo from "../slack/huddleInfo"; 
import { upsertUser } from "../util/db";
import { prisma } from "../util/prisma";
import userJoinedHuddle from "../events/userJoinedHuddle";
import userLeftHuddle from "../events/userLeftHuddle";
import { whisper } from "../slack/whisper";

// pretty much manually trigger the event

app.command('/fix-huddle', async ({ ack, payload }) => {
    // console.log("Recieved huddle update event");
    await ack();
    
    const slackId = payload.user_id;

    // Get huddle info
    const huddleRaw = (await huddleInfo());
    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }

    const huddle = huddleRaw.huddles[0];

    const inHuddle = huddle.active_members.includes(slackId);

    const user = await upsertUser(slackId, inHuddle);

    if (!user) {
        return;
    }

    const previousHuddleStatus = user.inHuddle;

    // if they weren't in the huddle before but the user joined the huddle, trigger a user joined event
    if (!previousHuddleStatus && inHuddle) {
        await prisma.user.update({
            where: {
                slackId: slackId
            },
            data: {
                inHuddle: true
            }
        });

        userJoinedHuddle({ 
            slackId: slackId,
            huddle
        });

        return;
    } 

    // if they were in the huddle but the user left the huddle, update the call
    if (previousHuddleStatus && !inHuddle) {
        await prisma.user.update({
            where: {
                slackId: slackId
            },
            data: {
                inHuddle: false
            }
        });

        userLeftHuddle({ 
            slackId: slackId,
            huddle
        });

        return;
    }

    await whisper({
        user: slackId,
        text: `You are already ${inHuddle ? 'in' : 'not in'} the huddle`
    })
});
