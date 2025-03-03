import { app } from "../slack/bolt";
import huddleInfo from "../slack/huddleInfo";
import { whisper } from "../slack/whisper";
import { prisma } from "../util/prisma";
import { genProgressBar, t } from "../util/transcript";
import createSession from "../sessions/create";
import { Config } from "../config";
import { mirrorMessage } from "../slack/logger";
import { isItTime } from "../isItTime";

// pretty much treat this as the user leaving the huddle

app.command('/hack', async ({ ack, payload }) => {
    try {
        await ack();

        await mirrorMessage({
            message: 'user ran `/hack`',
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
                    notIn: ['COMPLETED', 'CANCELLED']
                }
            }
        });

        if (!session || session.state === 'CANCELLED' || session.state === 'COMPLETED') { 
            const huddleRaw = (await huddleInfo());
            if (!huddleRaw) { 
                throw new Error('api returned null. no huddle found');
            }
            if (huddleRaw.huddles.length === 0) { 
                await whisper({
                    user: payload.user_id,
                    header: "you're not in a huddle!",
                    text: "seems like no one is in a huddle rn. you should start one!"
                });

                return;
            }

            const huddle = huddleRaw.huddles[0];

            const inHuddle = huddle.active_members.includes(payload.user_id);

            if (!inHuddle) {
                await whisper({
                    user: payload.user_id,
                    header: "you're not in a huddle!",
                    text: "you should join the huddle!"
                });

                return;
            }

            await whisper({
                user: payload.user_id,
                header: "yooooo! ready to hack? here's what you gotta do...",
                text: t('hack_initial_scrap')
            })

            await createSession({
                    slackId: payload.user_id,
                    callId: huddle.call_id
            });

            return;
        }
        else if (session.state === 'WAITING_FOR_INITAL_SCRAP') {
            await whisper({
                user: payload.user_id,
                header: "i'm waiting for your first scrap! let me give you the rundown again:",
                text: t('hack_initial_scrap')
            })

            return;
        }
        else if (session.state === 'SESSION_PENDING') {
            const now = new Date();
            const sinceJoin = now.getTime() - session.joinedAt.getTime();

            const minutes = (sinceJoin/1000/60)
            const minutesToNextHour = minutes % 60;
            const cups = Math.floor(minutes/60);

            const timeUntilNextScrap = (session.lastUpdate.getTime() + Config.FIRST_REMINDER) - now.getTime();
            const minutesUntilNextScrap = Math.ceil(timeUntilNextScrap/1000/60);

            const minutesCounted = (session.elapsed/1000/60);
            const countedCups = Math.floor(minutesCounted/60);

            await whisper({
                user: payload.user_id,
                header: `${genProgressBar(10, minutesToNextHour/60)} ${minutesToNextHour.toFixed(0)}m/60m before I pour your next cup!`,
                text: `you've been in the huddle for ${minutes.toFixed(0)}m! that's ${cups} cups of coffee!

i've only counted ${minutesCounted.toFixed(0)}m so far. 
that means you'll earn ${countedCups} :cup: (cups) of coffee once you ship! (if you go afk, it won't count!)
_(i count time everytime you post a scrap. once you post a scrap, this number will update!)_ 
                
you have ${minutesUntilNextScrap}m to send your next scrap before I boot you out!

oh and btw you can end early and stay on call by using \`/yap\`!`
            })

            return;
        }
        else if (session.state === 'WAITING_FOR_FINAL_SCRAP') {
            await whisper({
                user: payload.user_id,
                header: "i'm waiting for your final scrap! let me give you the rundown again:",
                text: t('hack_final_scrap')
            })

            return;
        }
        else if (session.state === 'UNINITIALIZED') {
            await whisper({
                user: payload.user_id,
                text: "i'm a little slow rn *twitch twich* try again in a bit"
            })

            return;
        }
    } catch (e) {
        console.error(e);

        await whisper({
            user: payload.user_id,
            header: "something went wrong",
            text: `${e}`
        })

        return;
    }
});