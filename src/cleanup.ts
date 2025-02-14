import type { Session } from "@prisma/client";
import { prisma } from "./util/prisma";
import { t } from "./util/transcript";
import { app } from "./slack/bolt";
import cancel from "./sessions/cancel";

import { Config } from "./config";
import { sendDM } from "./slack/dm";

function isAfter(date: Date, ms: number): boolean {
    return new Date().getTime() - date.getTime() > (ms);
}

// Checks if a session has been inactive for too long, especially after an update
export async function checkInactivity(session: Session): Promise<boolean> { // return true if session was cleaned up
    console.log("checking inactivity");

    if (session.state !== 'WAITING_FOR_INITAL_SCRAP') {
        return false;
    }

    // Check if it was sent within the last 5 minutes
    const now = new Date();

    if (now.getTime() - session.joinedAt.getTime() > (Config.AFTER_JOIN_TIMEOUT)) {
        // Delete the session
        console.log("user is inactive - deleting session");

        await prisma.session.delete({
            where: {
                id: session.id
            }
        });

        // Send inactivity message
        await sendDM({
            user: session.slackId,
            text: t('inactivity')
        });

        return true;
    }

    return false;
}

/*
All the things that need to be checked on a regular basis
- are there any sessions that are paused after 30 minutes? probably time to end the session early and send a message
- is there anyone on call who hasn't provided any updates in `Config.AFTER_UPDATE_TIMEOUT`? gently remind them
- is there anyone on call who has shown no activity in `Config.AFK_TIMEOUT`? end their session and send a message

todo:
- are there any sessions waiting for a final scrap after 30 minutes? cancel the session and send a message
*/
const pauseJob = async () => {
    console.log("checking for paused sessions");

    // get all paused sessions
    const paused = await prisma.session.findMany({
        where: {
            paused: true,
        }
    })

    console.log(`found ${paused.length} paused sessions`);

    let i = 0;
    for (const session of paused) {
        // check if the most recent update was Config.PAUSE_TIMEOUT ago
        if (session.lastUpdate.getTime() + (Config.PAUSE_TIMEOUT) < new Date().getTime()) {
            console.log(`session ${session.id} has been paused for too long`);

            // Send a message to the user
            await app.client.chat.postEphemeral({
                channel: Config.CAFE_CHANNEL,
                user: session.slackId,
                text: t('pause_timeout', {
                    slackId: session.slackId
                })
            });

            // End the session
            // todo: do I consider it cancelled or completed? how do i treat it - does it count or not?
            // for now, just complete it and move on
            await cancel(session);

            i++;
        }
    }

    console.log(`terminated ${i} paused sessions`);
}

// remind people to update and kick people who are AFK
const afkJob = async () => {
    console.log("checking for AFK sessions");

    const sessions = await prisma.session.findMany({
        where: {
            state: {
                notIn: ['COMPLETED', 'CANCELLED'],
            },
            leftAt: null,
        }
    });

    console.log(`found ${sessions.length} active sessions`);

    let i = 0;
    let j = 0;
    for (const session of sessions) {
        // check if it was sent within the last 5 minutes
        const now = new Date();

        // send a gentle reminder if it was sent more than Config.AFTER_UPDATE_TIMEOUT ago
        if (isAfter(session.lastUpdate, Config.FIRST_REMINDER)) {
            await sendDM({
                user: session.slackId,
                text: t('update_reminder', {
                    slackId: session.slackId
                })
            });

            i++;
        }

        // cancel their session if it was sent more than Config.AFK_TIMEOUT ago
        if (isAfter(session.lastUpdate, Config.AFK_TIMEOUT)) {
            // Send inactivity message
            await sendDM({
                user: session.slackId,
                text: t('afk_timeout', {
                    slackId: session.slackId
                })
            });

            await cancel(session);

            j++;
        }
    }

    console.log(`reminded ${i} users to update`);
    console.log(`terminated ${j} AFK sessions`);
};

// for now let's just not run polling, I think she's breaking bc of it

// // run at boot
// pauseJob();
// afkJob();

// setInterval(() => {
//     pauseJob();
//     afkJob();
// }, Config.CLEANUP_INTERVAL);