/*
Returns the state of the session
'IN_A_SESSION' - The user is currently in a session
'PAUSED_SESSION' - The user is currently in a session but it is paused
'NOT_IN_SESSION' - The user is not in a session
*/

type SessionState = 'PAUSED_SESSION' | 'NOT_IN_SESSION' | $Enums.State;

import type { $Enums, Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (args: {
    slackId: string,
}): Promise<Session | null> => {
    return await prisma.session.findFirst({
        where: {
            slackId: args.slackId,
            state: {
                notIn: ['COMPLETED', 'CANCELLED']
            }
        }
    });
}