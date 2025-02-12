import { app } from "./slack/bolt";
import huddleInfo from "./slack/huddleInfo"; 
import { upsertUser } from "./util/db";
import { prisma } from "./util/prisma";
import userJoinedHuddle from "./events/userJoinedHuddle";
import userLeftHuddle from "./events/userLeftHuddle";
import { minutes } from "./config";

const initalHuddleData = await huddleInfo();

let previousHuddleMembers: string[] = [];

if (initalHuddleData) {
    let previousHuddleMembers: string[] = initalHuddleData.huddles[0].active_members;;
}


setTimeout(async () => {
    // console.log("Recieved huddle update event");

    // Get huddle info
    const huddleRaw = (await huddleInfo());
    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }

    const huddle = huddleRaw.huddles[0];

    for (const slackId of previousHuddleMembers) {
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
        }
    };

    previousHuddleMembers = huddle.active_members;
}, minutes(0.5));
