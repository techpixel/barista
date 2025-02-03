// Session is completed and needs to go into airtable

import type { Session } from "@prisma/client";
import { prisma } from "../util/prisma";

export default async (session: Session) => {
    // todo
    console.log('Session is completed and needs to go into airtable');
}