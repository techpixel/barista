// Adds a scrap to a session

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";
import { app } from "../util/bolt";
import { t } from "../util/transcript";

import complete from "./complete";

/*

When we add a scrap to a session, we update the time elapsed on the session and update the lastUpdate field. We also create a new scrap record in the database.

*/

export default async (session: Session, scrap: {
    type: string,
    text: string,
    channel: string,
    ts: string,
    user: string
}) => {
    const now = new Date();

    switch (session.state) {
        // Session hasn't started yet
        case 'WAITING_FOR_INITAL_SCRAP': {
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
                            data: scrap,
                            type: "INITIAL",
                            user: {
                                connect: {
                                    slackId: scrap.user
                                }
                            }
                        }
                    }
                }
            });

            await app.client.chat.postMessage({
                channel: scrap.channel,
                text: t('logged_goal'),
                thread_ts: scrap.ts
            });
        } break;

        // Session is in progress
        case 'SESSION_PENDING': {
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
                            data: scrap,
                            type: "IN_PROGRESS",
                            user: {
                                connect: {
                                    slackId: scrap.user
                                }
                            }
                        }
                    }
                }
            });

            await app.client.chat.postMessage({
                channel: scrap.channel,
                text: t('logged_scrap'),
                thread_ts: scrap.ts
            });
        } break;

        // The session has ended and we're waiting for the user to ship
        case 'WAITING_FOR_FINAL_SCRAP': {
            if (!session.leftAt) {
                throw new Error('Session is in WAITING_FOR_FINAL_SCRAP state but leftAt is null');
            }

            await prisma.session.update({
                where: {
                    id: session.id
                },
                data: {
                    state: 'COMPLETED',
                    
                    lastUpdate: session.leftAt,
                    elapsed: session.elapsed + (now.getTime() - session.leftAt.getTime()),
                    
                    scraps: {
                        create: {
                            data: scrap,
                            type: "FINAL",
                            user: {
                                connect: {
                                    slackId: scrap.user
                                }
                            }
                        }
                    }
                }
            });

            complete(session);

            await app.client.chat.postMessage({
                channel: scrap.channel,
                text: t('logged_scrap'),
                thread_ts: scrap.ts
            });
        } break;
    }    
}