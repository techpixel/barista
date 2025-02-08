import { Prisma } from "@prisma/client";
import { checkInactivity } from "../cleanup";
import { app } from "../slack/bolt";
import { mirrorMessage } from "../slack/logger";
import { prisma } from "../util/prisma";
import { t } from "../util/transcript";

import addScrap from "../sessions/addScrap";

import { Config } from "../config";

/*

User joins call -> bot asks & user posts goal/scrap -> start a new session

User posts scraps -> update time elapsed

User left call ->  bot asks & user posts final scrap -> mark session as complete and record time

*/

app.event('message', async ({ event, client }) => {
    if (event.channel !== Config.CAFE_CHANNEL) { return; }
    
    switch (event.subtype) {
        // User shared a photo 
        case 'file_share': {
            const session = await prisma.session.findFirst({
                where: {
                    slackId: event.user,
                    state: {
                        notIn: ['COMPLETED', 'UNINITIALIZED', 'CANCELLED']
                    }
                }
            });

            if (!session) { return; }

            if (await checkInactivity(session)) { //returns true if there is a timeout
                return;
            }

            addScrap(session, {
                type: 'scrap',
                text: event.text!,
                channel: event.channel,
                ts: event.ts,
                user: event.user,
            }, event.files);
        } break;

        // User sent a goal
        case undefined: {
            const session = await prisma.session.findFirst({
                where: {
                    slackId: event.user,
                    state: 'WAITING_FOR_INITAL_SCRAP'
                }
            });

            if (!session) { return; }

            if (await checkInactivity(session) //returns true if there is a timeout
                || session.state !== 'WAITING_FOR_INITAL_SCRAP' //accepts only if the session is waiting for an initial scrap (goal)
            ) { 
                return;
            }

            // todo: i want to check if they specifically say "i'm hacking on ___" but right now let's just focus on basic flow logic

            addScrap(session, {
                type: 'goal',
                text: event.text!,
                channel: event.channel,
                ts: event.ts,
                user: event.user,
            });

            console.log(`user told bot what they're working on`);
            console.log(`bot started a new session`)
        } break;

        default:
            // console.log(`Recieved unhandled message event, subtype: ${event.subtype}`);
            break;
    }
});


