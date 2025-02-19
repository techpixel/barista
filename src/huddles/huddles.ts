import { minutes } from "../util/math";
import { app } from "../slack/bolt";
import huddleInfo, { activeHuddle, activeMembers, grabActiveHuddle, grabAllMembers, type Huddle } from "../slack/huddleInfo"; 
import { upsertUser } from "../util/db";
import { prisma } from "../util/prisma";
import userJoinedHuddle from "./userJoinedHuddle";
import userLeftHuddle from "./userLeftHuddle";

/*
TODO: use an assumptions based system rather than polling the API for huddle info

we can follow session states + use some sort of polling to determine if a user is in a huddle or not, rather than constantly firing off requests to the slack API
following `user_huddle_changed` is very unreliable, so we'll use `message` events to determine if a user is in a huddle or not + track time
*/

export const huddleCheck = async ({
    slackId,    
    huddle
}: {
    slackId: string,
    huddle?: Huddle
}) => {
    console.log(`Checking huddle status for ${slackId}`);

    const currentlyInHuddle = huddle ? huddle.active_members.includes(slackId) : false;
    const user = await upsertUser(slackId, currentlyInHuddle);

    if (!user) {
        console.log(`User ${slackId} not found in database`);
        return;
    }

    const wasInHuddle = user.inHuddle;

    console.log(`User ${slackId} was ${wasInHuddle ? '' : 'not '}in huddle, now ${currentlyInHuddle ? '' : 'not '}in huddle`);

    // if they weren't in the huddle before but the user joined the huddle, trigger a user joined event
    if (!wasInHuddle && currentlyInHuddle) {
        await prisma.user.update({
            where: {
                slackId
            },
            data: {
                inHuddle: true
            }
        });

        userJoinedHuddle({ 
            slackId,
        });
    } 

    // if they were in the huddle but the user left the huddle, update the call
    if (wasInHuddle && !currentlyInHuddle) {
        await prisma.user.update({
            where: {
                slackId
            },
            data: {
                inHuddle: false
            }
        });

        userLeftHuddle({ 
            slackId,
        });
    }
}

app.event('user_huddle_changed', async ({ payload }) => {
    await huddleCheck({
        slackId: payload.user.id,
    });
});

import './poll';