import { app } from "../slack/bolt";
import { prisma } from "../util/prisma";

// pretty much treat this as the user leaving the huddle

app.command('/yap', async ({ ack, payload }) => {
    await ack();

    const session = await prisma.session.findFirst({
        where: {
            slackId: payload.user_id,
            state: 'SESSION_PENDING'
        }
    });

    if (!session) { return; }

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

    console.log(`user wants to yap`)
    console.log(`waiting for final scrap`)
});