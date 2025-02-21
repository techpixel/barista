import { ScrapType } from "@prisma/client";
import { app } from "../../src/slack/bolt";
import { prisma } from "../../src/util/prisma";

import addScrap from "../oldAddScrap";

import { activeHuddle, activeMembers } from "../../src/slack/huddleInfo";
import { upsertUser } from "../../src/util/db";
import start from "../../src/sessions/start";
import end from "../../src/sessions/end";

app.event('message', async ({ event, client }) => {
    if (event.subtype !== 'file_share' && event.subtype !== undefined) {
        return;
    }

    console.log("Recieved scrap update");

    const huddleMembers = await activeMembers();

    const slackId = event.user;
    const currentlyInHuddle = huddleMembers.includes(slackId);

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