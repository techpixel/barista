// Adds a scrap to a session

import type { Session } from "@prisma/client";
import { prisma } from "../src/util/prisma";
import { app } from "../src/slack/bolt";
import { t } from "../src/util/transcript";

import end from "../src/sessions/end";
import { scraps } from "../src/util/airtable";
import type { FileShareMessageEvent } from "@slack/types";
import type { Attachment } from "airtable";

/*

When we add a scrap to a session, we update the time elapsed on the session and update the lastUpdate field. We also create a new scrap record in the database.

*/
async function createScrap(args: {
    session: Session, 
    scrap: object
}) {
    const now = new Date();

    return await prisma.session.update({
        where: {
            id: args.session.id
        },
        data: {
            state: 'SESSION_PENDING',
            
            lastUpdate: now,
            elapsed: args.session.elapsed + (now.getTime() - args.session.lastUpdate.getTime()),
            
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
}


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

            end(session);

            const lifetimeElapsed = await prisma.session.aggregate({
                where: {
                    slackId: session.slackId,
                    state: 'COMPLETED',                
                },
                _sum: {
                    elapsed: true,
                }
            });

            const totalCups = lifetimeElapsed._sum.elapsed ? lifetimeElapsed._sum.elapsed : 0;

            console.log(`session completed. total cups lifetime: ${totalCups / 1000 / 60 / 60} cups`);

            await app.client.chat.postMessage({
                channel: scrap.channel,
                text: t('finish', {
                    cups: Math.floor(session.elapsed / 1000 / 60 / 60), // (in hours)
                    totalCups: Math.floor(totalCups / 1000 / 60 / 60)
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