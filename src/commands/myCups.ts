import type { AnyBlock } from "@slack/types";
import { Config } from "../config";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import { prisma } from "../util/prisma";
import { formatHour } from "../util/transcript";

app.command('/my-cups', async ({ ack, payload }) => {
    await ack();

    await mirrorMessage({
        message: 'user ran `/my-cups`',
        user: payload.user_id,
        channel: payload.channel_id,
        type: 'slash-command'
    })

    const start = new Date();
    console.log(`user wants to know their cups`);

    let blocks: AnyBlock[] = [{
        type: 'context',
        elements: [{
            type: 'mrkdwn',
            text: '_psst..._'
        }]
    }, {
        type: 'divider'
    }];

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

        const inProgressElapsed = await prisma.session.aggregate({
            where: {
                slackId: payload.user_id,
                state: {
                    notIn: ['COMPLETED', 'CANCELLED']
                }
            },
            _sum: {
                elapsed: true,
            }
        });

        if (lifetimeElapsed._sum.elapsed) {
            // user not in a session rn

            const totalMs = lifetimeElapsed._sum.elapsed;
            const totalCups = lifetimeElapsed._sum.elapsed / 1000 / 60 / 60; // (in hours)
    
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `You have ${totalCups.toFixed(0)} _total_ cups!\n(that's ${formatHour(totalMs)} hours)`
                }
            });

            console.log(`user has ${totalCups.toFixed(0)} cups`);
        }         

        if (inProgressElapsed._sum.elapsed) { 
            const inProgressMs = inProgressElapsed._sum.elapsed;
            const inProgressCups = inProgressElapsed._sum.elapsed / 1000 / 60 / 60; // (in hours)
    
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `I've poured ${inProgressCups.toFixed(0)} cups in this session!\n(that's ${formatHour(inProgressMs)} hours)`, 
                }
            });
        } else {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `You're not in a session right now!`
                }
            });
        }

        await app.client.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            blocks: blocks
        });
    } catch (e) {
        console.error(e);
    }

    const end = new Date();
    console.log(`command executed in ${end.getTime() - start.getTime()}ms`);
});