import type { Session } from "@prisma/client";
import { prisma } from "./util/prisma";
import { config, t } from "./util/transcript";
import { app } from "./util/bolt";

/*
- run AFK checks
- send gentle reminders
*/

export async function checkInactivity(session: Session): Promise<boolean> { // return true if session was cleaned up
    console.log("checking inactivity");

    // Check if it was sent within the last 5 minutes
    const now = new Date();

    if (now.getTime() - session.joinedAt.getTime() > (config.AFTER_JOIN_TIMEOUT * 1000) && session.state === 'WAITING_FOR_INITAL_SCRAP') {
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

// // This script will run every 10 minutes to remove sessions where the user did not set a goal
// setInterval(() => {
//     console.log("Cleaning up old huddles");
    
// }, config.AFTER_JOIN_DELAY,);