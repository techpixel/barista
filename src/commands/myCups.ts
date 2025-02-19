import type { AnyBlock } from "@slack/types";
import { Config } from "../config";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import { prisma } from "../util/prisma";
import { formatHour } from "../util/transcript";
import { whisper } from "../slack/whisper";
import { users } from "../util/airtable";

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
        // const lifetimeElapsed = await prisma.session.aggregate({
        //     where: {
        //         slackId: payload.user_id,
        //         state: 'COMPLETED',                
        //     },
        //     _sum: {
        //         elapsed: true,
        //     }
        // });

        // use airtable to get the user entry
        const airtableUser = await users.select({
            filterByFormula: `{Slack ID} = "${payload.user_id}"`
        }).all();

        console.log(airtableUser);

        const lifetimeElapsed = airtableUser[0].fields['Total Time in Call'] as number; // in minutes

        console.log(`lifetime elapsed: ${lifetimeElapsed}`)

        if (lifetimeElapsed) {
            // user not in a session rn

            const totalCups = Math.floor(lifetimeElapsed/ 60);
    
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `You have ${totalCups} _total_ cups!\n(that's ${(lifetimeElapsed/60).toFixed(2)} hours)`
                }
            });

            console.log(`user has ${totalCups} cups`);
        } else {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `couldn't find you in airtable!` 
                }
            });
        }

        // if (inProgressElapsed._sum.elapsed) { 
        //     const inProgressMs = inProgressElapsed._sum.elapsed;
        //     const inProgressCups = inProgressElapsed._sum.elapsed / 1000 / 60 / 60; // (in hours)
    
        //     blocks.push({
        //         type: 'section',
        //         text: {
        //             type: 'mrkdwn',
        //             text: `I've poured ${inProgressCups.toFixed(0)} cups in this session!\n(that's ${formatHour(inProgressMs)} hours)`, 
        //         }
        //     });
        // } else {
        //     blocks.push({
        //         type: 'section',
        //         text: {
        //             type: 'mrkdwn',
        //             text: `You're not in a session right now!`
        //         }
        //     });
        // }

        await app.client.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            blocks: blocks
        });
    } catch (e) {
        console.error(e);

        whisper({
            user: payload.user_id,
            text: `*twitch twitch* i erm broke something: ${e}`
        });
    }

    const end = new Date();
    console.log(`command executed in ${end.getTime() - start.getTime()}ms`);
});