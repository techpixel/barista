import type { Session } from "@prisma/client";
import { prisma } from "./util/prisma";
import { config, t } from "./util/transcript";
import { app } from "./slack/bolt";
import cancel from "./sessions/cancel";

function isAfter(date: Date, seconds: number): boolean {
    return new Date().getTime() - date.getTime() > (seconds * 1000);
}

// Checks if a session has been inactive for too long, especially after an update
export async function checkInactivity(session: Session): Promise<boolean> { // return true if session was cleaned up
    console.log("checking inactivity");

    if (session.state !== 'WAITING_FOR_INITAL_SCRAP') {
        return false;
    }

    // Check if it was sent within the last 5 minutes
    const now = new Date();

    if (now.getTime() - session.joinedAt.getTime() > (config.AFTER_JOIN_TIMEOUT * 1000)) {
        // Delete the session
        console.log("user is inactive - deleting session");

        await prisma.session.delete({
            where: {
                id: session.id
            }
        });

        // Send inactivity message
        await app.client.chat.postEphemeral({
            channel: config.CAFE_CHANNEL,
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
- is there anyone on call who hasn't provided any updates in `config.AFTER_UPDATE_TIMEOUT`? gently remind them
- is there anyone on call who has shown no activity in `config.AFK_TIMEOUT`? end their session and send a message
*/
const pauseJob = async () => {
    // get all paused sessions
    const paused = await prisma.session.findMany({
        where: {
            paused: true,
        }
    })

    for (const session of paused) {
        // check if the most recent update was config.PAUSE_TIMEOUT ago
        if (session.lastUpdate.getTime() + (config.PAUSE_TIMEOUT * 1000) < new Date().getTime()) {
            // Send a message to the user
            await app.client.chat.postEphemeral({
                channel: config.CAFE_CHANNEL,
                user: session.slackId,
                text: t('pause_timeout')
            });

            // End the session
            // todo: do I consider it cancelled or completed? how do i treat it - does it count or not?
            // for now, just complete it and move on
            await cancel(session);
        }

    }
}

// remind people to update and kick people who are AFK
const afkJob = async () => {
    const sessions = await prisma.session.findMany({
        where: {
            state: {
                not: 'COMPLETED'
            }
        }
    });

    for (const session of sessions) {
        // check if it was sent within the last 5 minutes
        const now = new Date();

        // send a gentle reminder if it was sent more than config.AFTER_UPDATE_TIMEOUT ago
        if (isAfter(session.lastUpdate, config.AFTER_UPDATE_TIMEOUT)) {
            await app.client.chat.postEphemeral({
                channel: config.CAFE_CHANNEL,
                user: session.slackId,
                text: t('update_reminder')
            });
        }

        // send an afk warning if it was sent more than config.AFK_TIMEOUT ago
        if (isAfter(session.lastUpdate, config.AFK_TIMEOUT)) {
            // todo: kick them out of the session

            // await prisma.session.delete({
            //     where: {
            //         id: session.id
            //     }
            // });

            // Send inactivity message
            await app.client.chat.postEphemeral({
                channel: config.CAFE_CHANNEL,
                user: session.slackId,
                text: t('inactivity')
            });
        }
    }
};

setInterval(() => {
    pauseJob();
    afkJob();
}, config.CLEANUP_INTERVAL * 1000);