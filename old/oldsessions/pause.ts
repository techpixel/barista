// Pauses a session

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    const now = new Date();

    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            lastUpdate: now,
            elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime()),
            paused: true,
        }
    });
}