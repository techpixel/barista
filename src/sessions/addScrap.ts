// Adds a scrap to a session

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";
import { app } from "../slack/bolt";
import { t } from "../util/transcript";

import complete from "./complete";
import { scraps } from "../util/airtable";
import type { FileShareMessageEvent } from "@slack/types";
import type { Attachment } from "airtable";

/*

When we add a scrap to a session, we update the time elapsed on the session and update the lastUpdate field. We also create a new scrap record in the database.

*/

export default async (session: Session, scrap: {
    type: string,
    text: string,
    channel: string,
    ts: string,
    user: string,
},
attachments: FileShareMessageEvent['files'] = []
) => {
    console.log('adding scrap to session');

    const now = new Date();

    switch (session.state) {
        // Session hasn't started yet
        case 'WAITING_FOR_INITAL_SCRAP': 
            session = await prisma.session.update({
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
            
            break;
        // Session is in progress
        case 'SESSION_PENDING': 
            session = await prisma.session.update({
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
                text: t('logged_scrap', {
                    cups: (session.elapsed / 1000 / 60 / 60).toFixed(0) // (in hours) // todo: cups calculation function
                }),
                thread_ts: scrap.ts
            });

            break;
        // The session has ended and we're waiting for the user to ship
        case 'WAITING_FOR_FINAL_SCRAP': 
            if (!session.leftAt) {
                throw new Error('Session is in WAITING_FOR_FINAL_SCRAP state but leftAt is null');
            }

            session = await prisma.session.update({
                where: {
                    id: session.id
                },
                data: {
                    state: 'COMPLETED',
                    
                    lastUpdate: session.leftAt,
                    elapsed: session.elapsed + (now.getTime() - session.leftAt.getTime()),

                    paused: false,
                    
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

            const lifetimeElapsed = await prisma.session.aggregate({
                where: {
                    slackId: session.slackId,
                    state: 'COMPLETED',                
                },
                _sum: {
                    elapsed: true,
                }
            });

            const totalCups = lifetimeElapsed._sum.elapsed ? lifetimeElapsed._sum.elapsed + session.elapsed : 0;

            console.log(`session completed. total cups lifetime: ${totalCups / 1000 / 60 / 60} cups`);

            await app.client.chat.postMessage({
                channel: scrap.channel,
                text: t('finish', {
                    cups: (session.elapsed / 1000 / 60 / 60).toFixed(0), // (in hours)
                    totalCups: (totalCups / 1000 / 60 / 60).toFixed(0)
                }),
                thread_ts: scrap.ts
            });

            break;
    }    

    // add the scrap to airtable
    const user = await prisma.user.findUnique({
        where: { slackId: scrap.user }
    });

    if (!user) {
        throw new Error("User not found");
    }

    scraps.create({
        "Timestamp": scrap.ts,
        "Session": [session.airtableRecId],
        "User": [user.airtableRecId],

        "Type": scrap.type,
        "Text": scrap.text,
        "Created At": now.toISOString(),

        "Attachments": JSON.stringify(attachments?.map(attachment => attachment.permalink))
    });
}