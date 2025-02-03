import { Prisma } from "@prisma/client";
import { checkInactivity } from "../cleanup";
import { app, mirrorMessage } from "../util/bolt";
import { prisma } from "../util/prisma";
import { config, t } from "../util/transcript";

app.event('message', async ({ event, client }) => {
    if (event.channel !== config.CAFE_CHANNEL) { return; }


    switch (event.subtype) {
        // User shared a photo 
        case 'file_share': {
            const session = await prisma.session.findFirst({
                where: {
                    slackId: event.user,
                }
            });

            if (!session) { return; }

            switch (session.state) {
                // Session hasn't started yet
                case 'WAITING_FOR_INITAL_SCRAP': {
                    const now = new Date();

                    await prisma.session.update({
                        where: {
                            id: session.id
                        },
                        data: {
                            state: 'SESSION_PENDING',
                            lastUpdate: now,
                            elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime()),
                            scraps: {
                                create: {
                                    data: {
                                        type: 'goal',
                                        text: event.text!,
                                        channel: event.channel,
                                        ts: event.ts,
                                        user: event.user
                                    },
                                    type: "INITIAL",
                                    user: {
                                        connect: {
                                            slackId: event.user
                                        }
                                    }
                                }
                            }
                        }
                    });

                    await app.client.chat.postMessage({
                        channel: event.channel,
                        text: t('logged_goal'),
                        thread_ts: event.ts
                    });
                } break;

                // Session is in progress
                case 'SESSION_PENDING': {
                    const scrap = await prisma.scrap.create({
                        data: {
                            data: {
                                type: 'scrap',
                                text: event.text!,
                                channel: event.channel,
                                ts: event.ts,
                                user: event.user
                            },
                            type: "IN_PROGRESS",
                            session: {
                                connect: {
                                    id: session.id
                                }
                            },
                            user: {
                                connect: {
                                    slackId: event.user
                                }
                            }
                        }
                    });

                    await prisma.session.update({
                        where: {
                            id: session.id
                        },
                        data: {
                            lastUpdate: scrap.shipTime,
                            elapsed: session.elapsed + (scrap.shipTime.getTime() - session.lastUpdate.getTime()),
                        }
                    });

                    await app.client.chat.postMessage({
                        channel: event.channel,
                        text: t('logged_scrap'),
                        thread_ts: event.ts
                    });
                } break;

                // The session has ended and we're waiting for the user to ship
                case 'WAITING_FOR_FINAL_SCRAP': {
                    await prisma.scrap.create({
                        data: {
                            data: {
                                type: 'scrap',
                                text: event.text!,
                                channel: event.channel,
                                ts: event.ts,
                                user: event.user
                            },
                            type: "FINAL",
                            session: {
                                connect: {
                                    id: session.id
                                }
                            },
                            user: {
                                connect: {
                                    slackId: event.user
                                }
                            }
                        }
                    });

                    if (!session.leftAt) {
                        throw new Error('Session is in WAITING_FOR_FINAL_SCRAP state but leftAt is null');
                    }

                    await prisma.session.update({
                        where: {
                            id: session.id
                        },
                        data: {
                            elapsed: session.elapsed + (new Date().getTime() - session.leftAt.getTime()),
                            state: 'COMPLETED'
                        }
                    });

                    await app.client.chat.postMessage({
                        channel: event.channel,
                        text: t('logged_scrap'),
                        thread_ts: event.ts
                    });
                } break;
                default: {
                    // console.log("Recieved message event, but no session found");
                } break;
            }
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

            if (await checkInactivity(session)) { //returns true if there is a timeout
                return;
            }

            // i want to check if they specifically say "i'm hacking on ___" but right now let's just focus on basic flow logic
            await app.client.chat.postEphemeral({
                channel: event.channel,
                user: event.user,
                text: t('logged_goal')
            });

            await prisma.session.update({
                where: {
                    id: session.id
                },
                data: {
                    state: 'SESSION_PENDING',
                    scraps: {
                        create: {
                            data: {
                                type: 'goal',
                                text: event.text!,
                                channel: event.channel,
                                ts: event.ts,
                                user: event.user
                            },
                            type: "INITIAL",
                            user: {
                                connect: {
                                    slackId: event.user
                                }
                            }
                        }
                    }
                }
            });

            console.log(`user told bot what they're working on`);
            console.log(`bot started a new session`)
        } break;

        default:
            // console.log(`Recieved unhandled message event, subtype: ${event.subtype}`);
            break;
    }
});


