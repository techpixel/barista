import { app } from "../slack/bolt";
import huddleKick from "../slack/huddleKick";
import { prisma } from "../util/prisma";

app.command('/my-cups', async ({ ack, payload }) => {
    await ack();

    try {
        const lifetimeElapsed = await prisma.session.aggregate({
            where: {
                slackId: payload.user_id,
                state: 'COMPLETED',                
            },
            _sum: {
                elapsed: true,
            }
        });

        if (!lifetimeElapsed._sum.elapsed) { return; }

        const totalCups = lifetimeElapsed._sum.elapsed / 1000 / 60 / 60; // (in hours)

        await app.client.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: `You have ${totalCups.toFixed(0)} cups!` 
        });
    } catch (e) {
        console.error(e);
    }
});