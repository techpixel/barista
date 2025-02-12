// Create a new session

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

    const uuid = uuidv4();

    const airtableSession = await sessions.create({
        "ID": uuid,
        "User": [user.airtableRecId],
        "Call ID": args.callId,
        "Joined At": now.toISOString(),
        "State": "WAITING_FOR_INITAL_SCRAP"
    });

    await prisma.session.create({
        data: {
            id: uuid,
            user: { connect: { slackId: args.slackId } },
            callId: args.callId,
            joinedAt: now,
            lastUpdate: now,
            state: 'WAITING_FOR_INITAL_SCRAP',
            airtableRecId: airtableSession.id
        }
    });
}