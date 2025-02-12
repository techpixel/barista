import { app } from "../slack/bolt";
import huddleKick from "../slack/huddleKick";
import { prisma } from "../util/prisma";
import { formatHour } from "../util/transcript";

app.command('/my-cups', async ({ ack, payload }) => {
    await ack();

    const start = new Date();
    console.log(`user wants to know their cups`);

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

        const totalMs = lifetimeElapsed._sum.elapsed;
        const totalCups = lifetimeElapsed._sum.elapsed / 1000 / 60 / 60; // (in hours)

        await app.client.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: `You have ${totalCups.toFixed(0)} _total_ cups!\n(that's ${formatHour(totalMs)} hours)`, 
        });

        console.log(`user has ${totalCups.toFixed(0)} cups`);
    } catch (e) {
        console.error(e);
    }

    const end = new Date();
    console.log(`command executed in ${end.getTime() - start.getTime()}ms`);
});