import huddleInfo, { grabActiveHuddle, type Huddle } from "./slack/huddleInfo"; 
import { upsertUser } from "./util/db";
import { prisma } from "./util/prisma";
import userJoinedHuddle from "./huddles/userJoinedHuddle";
import userLeftHuddle from "./huddles/userLeftHuddle";
import { minutes } from "./config";
import { sleep } from "bun";

/*

The idea is that we take a snapshot of the huddle members every 5 minutes and compare it to the previous snapshot.

*/

const initalHuddleData = await huddleInfo();

let previousHuddleMembers: string[] = [];

if (initalHuddleData) {
    let inital_active_huddle = grabActiveHuddle(initalHuddleData.huddles);

    if (inital_active_huddle) {
        let inital_active_members = inital_active_huddle.active_members;

        previousHuddleMembers = inital_active_members;
    }
}

const pollHuddle = async () => {
    console.log('polling huddle');

    // Get huddle info
    const huddleRaw = (await huddleInfo());
    if (!huddleRaw) { return; }
    if (huddleRaw.huddles.length === 0) { return; }
       
    const active_huddle = grabActiveHuddle(huddleRaw.huddles);
       
    if (!active_huddle) {
        return;
    }
       
    const active_members = active_huddle.active_members;

    // compare previous huddle members to current huddle members, and run the huddle check for those that have changed
    const previousHuddleMembersSet = new Set(previousHuddleMembers);
    const activeMembersSet = new Set(active_members);
    const changedMembers = previousHuddleMembersSet.symmetricDifference(activeMembersSet);

    for (const member of changedMembers) {
        runHuddleCheck({
            slackId: member,
            active_huddle
        });
    }

    previousHuddleMembers = active_members;

    console.log('polling huddle complete. sleeping for 5 minutes');

    await sleep(minutes(5));
    
    pollHuddle();
};

const runHuddleCheck = async (args: {
    slackId: string,
    active_huddle: Huddle
}) => {
        const inHuddle = args.active_huddle.active_members.includes(args.slackId);
    
        const user = await upsertUser(args.slackId, inHuddle);
    
        if (!user) {
            return;
        }
    
        const previousHuddleStatus = user.inHuddle;
    
        // if they weren't in the huddle before but the user joined the huddle, trigger a user joined event
        if (!previousHuddleStatus && inHuddle) {
            await prisma.user.update({
                where: {
                    slackId: args.slackId
                },
                data: {
                    inHuddle: true
                }
            });
    
            userJoinedHuddle({ 
                slackId: args.slackId,
                huddle: args.active_huddle
            });
        } 
    
        // if they were in the huddle but the user left the huddle, update the call
        if (previousHuddleStatus && !inHuddle) {
            await prisma.user.update({
                where: {
                    slackId: args.slackId
                },
                data: {
                    inHuddle: false
                }
            });
    
            userLeftHuddle({ 
                slackId: args.slackId,
                huddle: args.active_huddle
            });
        }
};

pollHuddle();