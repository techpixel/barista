import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { users, callLogs } from "./airtable";
import { error } from "./bolt";

export async function createUser(slackId: string) {
    console.log("Creating user", slackId);

    let airtableUser = await users.create({
        "Slack ID": slackId
    });

    return await prisma.user.create({
        data: { slackId, airtableRecId: airtableUser.id }
    });
}

export async function upsertUser(slackId: string) {
    try {
        return await prisma.user.upsert({
            where: {
                slackId,
            },
            update: {},
            create: {
                slackId,
                airtableRecId: (
                    await users.create({
                        "Slack ID": slackId
                    })
                ).id
            }
        });
    } catch (e: any) {
        error(e, slackId);
        throw e;
    }
}

export async function createCallLog(call: Prisma.CallGetPayload<{
    include: { user: true }
}>) {
    console.log("Creating call log", call);

    await callLogs.create({
          "UID": call.id.toString(),
          "Call ID": call.callId,
          "Joined At": call.joinedAt.toISOString(),
          "Left At": call.leftAt?.toISOString(),
          "User": [call.user.airtableRecId]
    });        
}