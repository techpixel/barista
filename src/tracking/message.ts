import { ScrapType } from "@prisma/client";
import { app } from "../slack/bolt";
import { prisma } from "../util/prisma";

import addScrap from "../sessions/addScrap";

import { activeHuddle } from "../slack/huddleInfo";
import { upsertUser } from "../util/db";
import start from "../sessions/start";
import end from "../sessions/end";

app.event('message', async ({ event, client }) => {
    if (
        event.subtype === 'file_share' // User shared a photo
        || event.subtype === undefined // User sent a goal
    ) {
        console.log("Recieved scrap update");

        const huddle = await activeHuddle();

        if (!huddle) {
            return;
        }

        const slackId = event.user;
        const currentlyInHuddle = huddle.active_members.includes(slackId);
        const user = await upsertUser(slackId, currentlyInHuddle);

        console.log(`User ${slackId} is in huddle: ${currentlyInHuddle}`);

        if (!user) {
            return;
        }

        let session = await prisma.session.findFirst({
            where: {
                slackId: slackId,
                state: {
                    notIn: ['COMPLETED', 'CANCELLED']
                }
            }
        });

        if (currentlyInHuddle) { 
            let state: ScrapType = 'IN_PROGRESS';

            if (!session) { 
                session = await start({
                    slackId,
                    callId: huddle.call_id
                })
                state = 'INITIAL';
            }

            await addScrap(session, {
                state,
                type: event.subtype === 'file_share' ? 'scrap' : 'goal',
                text: event.text!,
                channel: event.channel,
                ts: event.ts,
                user: event.user,
            }, event.files);            
        } else { 
            if (session) {
                await addScrap(session, {
                    state: 'FINAL',
                    type: event.subtype === 'file_share' ? 'scrap' : 'goal',
                    text: event.text!,
                    channel: event.channel,
                    ts: event.ts,
                    user: event.user,
                }, event.files);

                await end(session)
            }
        }
    }
});