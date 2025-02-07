import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { users } from "./airtable";
import { error } from "../slack/logger";

export async function createUser(slackId: string) {
    console.log("Creating user", slackId);

    let airtableUser = await users.create({
        "Slack ID": slackId
    });

    return await prisma.user.create({
        data: { slackId, airtableRecId: airtableUser.id }
    });
}

export async function upsertUser(slackId: string, inHuddle: boolean) {
    try {
        // well we know for a fact that they weren't in the huddle before if we're creating them
        // so let's check if they exist first
        const user = await prisma.user.findUnique({
            where: {
                slackId
            }
        });

        // only create them if they're now in the huddle
        if (!user && inHuddle) {
            return await createUser(slackId);
        } else if (user) {
            return user;
        } else {
            return null;
        }
    } catch (e: any) {
        error(e, slackId);
        throw e;
    }
}

// export async function createCallLog(call: Prisma.CallGetPayload<{
//     include: { user: true }
// }>) {
//     console.log("Creating call log", call);

//     await callLogs.create({
//           "UID": call.id.toString(),
//           "Call ID": call.callId,
//           "Joined At": call.joinedAt.toISOString(),
//           "Left At": call.leftAt?.toISOString(),
//           "User": [call.user.airtableRecId]
//     });        
// }