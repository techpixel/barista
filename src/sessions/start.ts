/*
Modified `create` function which starts the session
skips the wait for inital scrap state assuming that we have the inital scrap
*/

import { Config } from "../config";
import { mirrorMessage } from "../slack/logger";
import { sessions } from "../util/airtable";
import { prisma } from "../util/prisma";
import { v4 as uuidv4 } from 'uuid';

export default async (args: {
    slackId: string,
    callId: string
}) => {
    const now = new Date();

    const user = await prisma.user.findUnique({
        where: { slackId: args.slackId }
    });

    if (!user) {
        throw new Error("User not found");
    }

    mirrorMessage({
        message: `Starting session for <@${args.slackId}>`,
        channel: Config.CAFE_CHANNEL,
        user: args.slackId,
        type: 'session_update'
    })

    const uuid = uuidv4();

    const airtableSession = await sessions.create({
        "ID": uuid,
        "User": [user.airtableRecId],
        "Call ID": args.callId,
        "Joined At": now.toISOString(),
        "State": "SESSION_PENDING"
    });

    return await prisma.session.create({
        data: {
            id: uuid,
            user: { connect: { slackId: args.slackId } },
            callId: args.callId,
            joinedAt: now,
            lastUpdate: now,
            state: 'SESSION_PENDING',
            airtableRecId: airtableSession.id
        }
    });
}