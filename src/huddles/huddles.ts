import { app } from "../slack/bolt";
import { upsertUser } from "../util/db";
import { prisma } from "../util/prisma";
import userJoinedHuddle from "./userJoinedHuddle";
import userLeftHuddle from "./userLeftHuddle";
import './poll';
import { activeHuddle, type Huddle } from "../slack/huddleInfo";
import AsyncLock from "async-lock";

/*
TODO: use an assumptions based system rather than polling the API for huddle info

we can follow session states + use some sort of polling to determine if a user is in a huddle or not, rather than constantly firing off requests to the slack API
following `user_huddle_changed` is very unreliable, so we'll use `message` events to determine if a user is in a huddle or not + track time
*/

const lock = new AsyncLock();

export const huddleCheck = async ({
    slackId,    
    huddle
}: {
    slackId: string,
    huddle?: Huddle
}) => {
    lock.acquire(slackId, async () => {
        if (!huddle) {
            huddle = await activeHuddle();
        }

        console.log(`huddle members: ${huddle ? huddle.active_members : 'no huddle'}`);

        const currentlyInHuddle = huddle ? huddle.active_members.includes(slackId) : false;
        const user = await upsertUser(slackId, currentlyInHuddle);
        // const activeSession = await prisma.session.findFirst({
        //     where: {
        //         slackId,
        //         state: {
        //             notIn: ['COMPLETED', 'CANCELLED']
        //         },
        //         paused: false
        //     }
        // });

        if (!user) {
            console.log(`User ${slackId} not found in database`);
            return;
        }

        const wasInHuddle = user.inHuddle;

        console.log(`User ${slackId} was ${wasInHuddle ? '' : 'not '}in huddle, now ${currentlyInHuddle ? '' : 'not '}in huddle`);
        console.log(`User ${slackId} ${(!wasInHuddle && currentlyInHuddle) ? 'joined' : (wasInHuddle && !currentlyInHuddle) ? 'left' : 'stayed in'} the huddle`);

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
                callId: huddle ? huddle.call_id : ''
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
    });
}

app.event('user_huddle_changed', async ({ payload }) => {
    console.log(`recieved user_huddle_changed event for ${payload.user.id}`);

    await huddleCheck({
        slackId: payload.user.id,
    });
});