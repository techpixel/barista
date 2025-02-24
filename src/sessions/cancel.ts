
import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";
import { sessions } from "../util/airtable";
import { msToSeconds } from "../util/math";

export default async (session: Session, cancelReason?: string) => {
    const now = new Date();

    // turn the last scrap into a final scrap
    const lastScrap = await prisma.scrap.findFirst({
        where: {
            sessionId: session.id,
            type: 'scrap',
            state: "IN_PROGRESS"
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // if there isn't a last scrap, just cancel the session
    if (!lastScrap) {
        await prisma.session.update({
            where: {
                id: session.id
            },
            data: {
                state: "CANCELLED",
                leftAt: now,
                paused: false
            }
        })

        await sessions.update(session.airtableRecId, {
            "Left At": session.lastUpdate.toISOString(),
            "State": "CANCELLED",
            "Elapsed": msToSeconds(session.elapsed),
            "Cancel Reason": cancelReason
        });
    }
    // if there is a last scrap, let's consider it a final scrap. but do not update the time
    else {
        await prisma.session.update({
            where: {
                id: session.id
            },
            data: {
                state: "COMPLETED",
                leftAt: lastScrap.createdAt,
                paused: false,
            }
        });

        await sessions.update(session.airtableRecId, {
            "Left At": lastScrap.createdAt.toISOString(),
            "State": "COMPLETED",
            "Elapsed": msToSeconds(session.elapsed),
            "Cancel Reason": cancelReason ? cancelReason + " (completed)" : undefined
        });
    }
}