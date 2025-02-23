import { Intervals } from "../config";
import { activeHuddle, allMembers, grabAllMembers } from "../slack/huddleInfo";
import { minutes } from "../util/math";
import { prisma } from "../util/prisma";
import { huddleCheck } from "./huddles";

const checkHuddleLeaves = async () => {
    const inHuddle = await prisma.user.findMany({
        where: {
            inHuddle: true
        }
    });

    console.log(`polling for individuals marked as in huddle, found ${inHuddle.length} members in huddle`);

    for (const user of inHuddle) {
        console.log(`checking huddle for ${user.slackId}`);

        huddleCheck({
            slackId: user.slackId,
        });
    }
};

const checkHuddleJoins = async () => {
    const huddle = await activeHuddle();
       
    let activeMembers: string[] = allMembers(huddle);

    // compare previous huddle members to current huddle members, and run the huddle check for those that have changed

    console.log(`polling for individuals in huddle, found ${activeMembers} members in huddle`);
    for (const member of activeMembers) {
        console.log(`checking huddle for ${member}`);

        huddleCheck({
            slackId: member,
        });
    }
}

setInterval(checkHuddleLeaves, Intervals.HUDDLE_CHECK);
setInterval(checkHuddleJoins, Intervals.HUDDLE_CHECK);