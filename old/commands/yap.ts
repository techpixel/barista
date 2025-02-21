import { Config } from "../config";
import { isItTime } from "../isItTime";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import { whisper } from "../slack/whisper";
import { prisma } from "../util/prisma";
import { t } from "../util/transcript";

// pretty much treat this as the user leaving the huddle

app.command('/yap', async ({ ack, payload }) => {
    await ack();

    await mirrorMessage({
        message: 'user ran `/yap`',
        user: payload.user_id,
        channel: payload.channel_id,
        type: 'slash-command'
    })

    if (await isItTime(payload.user_id)) {
        return;
    }  

    const session = await prisma.session.findFirst({
        where: {
            slackId: payload.user_id,
            state: {
                notIn: ['COMPLETED', 'CANCELLED', 'UNINITIALIZED']
            }
        }
    });

    if (!session) { 
        await whisper({
            user: payload.user_id,
            text: `doesn't seem like you're in a session rn! see ya later!`
        })

        return;
    }

    if (session.state === 'SESSION_PENDING') {
        const now = new Date();
        await prisma.session.update({
            where: {
                id: session.id
            },
            data: {
                state: 'WAITING_FOR_FINAL_SCRAP',
                leftAt: now,
                lastUpdate: now,
                elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime()),            
            }
        });

        await whisper({
            user: session.slackId,
            text: t('yap_final_scrap', {
                slackId: session.slackId
            })
        })

        console.log(`user wants to yap, requested to ship early`)
        console.log(`waiting for final scrap`)
    }
    else if (session.state === 'WAITING_FOR_INITAL_SCRAP') {
        // just delete the session
        await prisma.session.delete({
            where: {
                id: session.id
            }
        });

        await whisper({
            user: session.slackId,
            text: `seems like you're here to just yap! i won't be keeping track of your time. have fun!`
        })

        console.log(`user wants to yap`)
        console.log(`session deleted`)
    }
    else {
        await whisper({
            user: session.slackId,
            text: `seems like it's not the time to yap!`
        })
    }
});