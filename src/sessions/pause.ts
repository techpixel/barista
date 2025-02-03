// Pauses a session

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            paused: true,
        }
    });
}