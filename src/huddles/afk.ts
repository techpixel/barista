import { Config } from "../config";
import cancel from "../sessions/cancel";
import { app } from "../slack/bolt";
import { whisper } from "../slack/whisper";
import { minutes, msToSeconds } from "../util/math";
import { prisma } from "../util/prisma";
import { t } from "../util/transcript";

/*

Cancel a session if the user goes AFK 10 minutes after leaving the call

*/
const pauseJob = async () => {
    console.log("checking for paused sessions");

    // get all paused sessions
    const paused = await prisma.session.findMany({
        where: {
            paused: true,
            state: 'WAITING_FOR_FINAL_SCRAP'
        }
    })

    console.log(`found ${paused.length} paused sessions`);

    let i = 0;
    for (const session of paused) {
        if (!session.leftAt) { continue; }

        console.log(`it has been ${msToSeconds(new Date().getTime() - session.leftAt.getTime())}s since ${session.slackId} left the call`);
        if (session.leftAt.getTime() + (Config.PAUSE_TIMEOUT) < new Date().getTime()) {
            console.log(`session ${session.id} has gone afk after leaving the call`);

            // Send a message to the user
            await whisper({
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

setInterval(pauseJob, minutes(0.5));