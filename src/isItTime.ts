import { minutes } from "./config";
import { whisper } from "./slack/whisper";
import { prisma } from "./util/prisma";

const endTime = new Date('2025-02-18T06:00:00.000Z');

export async function isItTime(userId: string): Promise<boolean> {
    const now = new Date();

    if (now.getTime() > endTime.getTime()) {
        await whisper({
            user: userId,
            text: 'the cafe is closed for today!'
        });
        
        return true;
    }

    return false;
}

const x = setTimeout(async () => {
    const now = new Date();

    if (now.getTime() > endTime.getTime()) {
        const inProgressSessions = await prisma.session.findMany({
            where: {
                state: {
                    notIn: ['COMPLETED', 'CANCELLED']
                }
            }
        });

        // complete all in progress sessions
        for (const session of inProgressSessions) {
            await prisma.session.update({
                where: {
                    id: session.id
                },
                data: {
                    state: 'COMPLETED',
                    leftAt: now,
                    lastUpdate: now,
                    elapsed: session.elapsed + (now.getTime() - session.lastUpdate.getTime())

                }
            });
        }

        // stop the interval
        clearTimeout(x);
    }
}, minutes(1));