// Session is completed and needs to go into airtable

import type { Session } from "@prisma/client";
import { sessions } from "../util/airtable";
import { msToSeconds } from "../util/math";

export default async (session: Session) => {
    console.log('session is completed and needs to go into airtable');
    
    const now = new Date();

    await sessions.update(session.airtableRecId, {
        "Left At": now.toISOString(),
        "State": "COMPLETED",
        "Elapsed": msToSeconds(session.elapsed + (now.getTime() - session.lastUpdate.getTime()))
    });
}