// Unpauses a session

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    const now = new Date();

    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            paused: true,
            lastUpdate: now,
            state: 'SESSION_PENDING',
        }
    });
}