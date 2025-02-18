// Checks if a session is paused

import type { Session } from "@prisma/client";
// import { prisma } from "../util/prisma";

export default (session: Session) => {
    return session.paused;
}