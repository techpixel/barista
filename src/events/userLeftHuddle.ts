import { prisma } from "../util/prisma";
import { app, mirrorMessage } from "../util/bolt";
import type { Huddle } from "../util/bolt";
import { config } from "../util/transcript";

export default async (args: {
    slackId: string,
    huddle: Huddle
}) => {
    mirrorMessage({
        message: `${args.slackId} left the huddle`,
        user: args.slackId,
        channel: args.huddle.channel_id,
        type: 'huddle_left'
    });    

    // check if user hasn’t already posted ship + finished while in the call
    const session = await prisma.session.findFirst({
        where: {
            slackId: args.slackId,
            state: 'SESSION_PENDING'
        }
    });

    if (!session) { return; }

    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            state: 'WAITING_FOR_FINAL_SCRAP',
            leftAt: new Date(),
        }
    });

    const scraps = await prisma.scrap.findMany({
        where: {
            sessionId: session.id,
            type: 'IN_PROGRESS'
        },
        orderBy: {
            shipTime: 'desc'
        }
    }); 

    // They posted a scrap before leaving
    if (scraps.length > 0) {
        const scrap = scraps[0];

        await prisma.scrap.update({
            where: {
                id: scrap.id
            },
            data: {
                type: 'FINAL'
            }
        });

        await prisma.session.update({
            where: {
                id: session.id
            },
            data: {
                state: 'COMPLETED'
            }
        });
        
        await app.client.chat.postMessage({
            channel: args.huddle.channel_id,
            text: `<@${args.slackId}> has left the huddle. Their final scrap was: ${scrap.data}. placeholder`
        });

        return;
    }

    // They didn't post a scrap before leaving
    await app.client.chat.postEphemeral({
        channel: config.CAFE_CHANNEL,
        user: args.slackId,
        text: `You left the huddle without posting a scrap. If you want your time to count, please post a scrap. placeholder`
    })
}