//todo: differentiate cancelling and completion. 
//should there even be a difference? 
//does completion count but cancellation not?

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    await prisma.session.update({
        where: {
            id: session.id
        },
        data: {
            state: "CANCELLED"
        }
    })
}