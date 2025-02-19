//todo: differentiate cancelling and completion. 
//should there even be a difference? 
//does completion count but cancellation not?

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    const now = new Date();
    
    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            state: "CANCELLED",
            lastUpdate: now,
            elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime()),
            leftAt: now,
            paused: false
        }
    })
}