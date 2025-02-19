import { activeHuddle, allMembers, grabAllMembers } from "../slack/huddleInfo";
import { minutes } from "../util/math";
import { huddleCheck } from "./huddles";

let previousHuddleMembers: string[] = [];

setInterval(async () => {
    const huddle = await activeHuddle();
       
    let activeMembers: string[] = allMembers(huddle);

    // compare previous huddle members to current huddle members, and run the huddle check for those that have changed
    const previousHuddleMembersSet = new Set(previousHuddleMembers);
    const activeMembersSet = new Set(activeMembers);
    const changedMembers = previousHuddleMembersSet.symmetricDifference(activeMembersSet);

    for (const member of changedMembers) {
        huddleCheck({
            slackId: member,
            huddle
        });
    }

    previousHuddleMembers = activeMembers;
}, minutes(1));