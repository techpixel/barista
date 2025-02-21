/*
Returns the state of the session
'IN_A_SESSION' - The user is currently in a session
'PAUSED_SESSION' - The user is currently in a session but it is paused
'NOT_IN_SESSION' - The user is not in a session
*/

type SessionState = 'PAUSED_SESSION' | 'NOT_IN_SESSION' | $Enums.State;

import type { $Enums } from "@prisma/client";
import { Config } from "../config";
import { mirrorMessage } from "../slack/logger";
import { sessions } from "../util/airtable";
import { prisma } from "../util/prisma";
import { v4 as uuidv4 } from 'uuid';

export default async (args: {
    slackId: string,
}): Promise<SessionState> => {
    const session = await prisma.session.findFirst({
        where: {
            slackId: args.slackId,
            state: {
                notIn: ['COMPLETED', 'CANCELLED']
            }
        }
    });

    if (session) {
        if (session.paused) {
            return 'PAUSED_SESSION';
        } else {
            return session.state;
        }
    }

    return 'NOT_IN_SESSION';
}