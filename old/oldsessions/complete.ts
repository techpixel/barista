// Session is completed and needs to go into airtable

import type { Session } from "@prisma/client";
import { sessions } from "../util/airtable";

export default async (session: Session) => {
    // todo
    console.log('session is completed and needs to go into airtable');

    await sessions.update(session.airtableRecId, {
        "Left At": new Date().toISOString(),
        "State": "COMPLETED",
        "Elapsed": Math.floor((new Date().getTime() - session.joinedAt.getTime()) / 1000)
    });
}