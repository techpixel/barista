// Pauses a session

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    const now = new Date();

    return await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            state: 'WAITING_FOR_FINAL_SCRAP',
            leftAt: now,
            lastUpdate: now,
            elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime()),
            paused: true
        }
    });
}


