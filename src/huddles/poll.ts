import { activeHuddle, allMembers, grabAllMembers } from "../slack/huddleInfo";
import { minutes } from "../util/math";
import { prisma } from "../util/prisma";
import { huddleCheck } from "./huddles";

setInterval(async () => {
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
}, minutes(0.1));

setInterval(async () => {
    const huddle = await activeHuddle();

    const usersInHuddle = await prisma.user.findMany({
        where: {
            inHuddle: true
        }
    });

    console.log(`polling for individuals marked as in huddle, found ${usersInHuddle.length} members in huddle`);
    for (const user of usersInHuddle) {
        console.log(`checking huddle for ${user.slackId}`);

        huddleCheck({
            slackId: user.slackId,
        });
    }
}, minutes(0.1));