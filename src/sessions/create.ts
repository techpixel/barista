// Create a new session

import { prisma } from "../util/prisma";

export default async (args: {
    slackId: string,
    callId: string
}) => {
    const now = new Date();

    await prisma.session.create({
        data: {
            user: { connect: { slackId: args.slackId } },
            callId: args.callId,
            joinedAt: now,
            lastUpdate: now,
            state: 'WAITING_FOR_INITAL_SCRAP',
        }
    });
}