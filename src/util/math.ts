import { prisma } from "./prisma";

export function msToCups(ms: number): number {
    return Math.floor(ms / 1000 / 60 / 60);
}

export function msFormattedHours(ms: number): string {
    return (ms / 1000 / 60 / 60).toFixed(2);
}

export async function lifetimeCups(slackId: string): Promise<number> {
    const lifetimeElapsed = await prisma.session.aggregate({
        where: {
            slackId,
            state: 'COMPLETED',                
        },
        _sum: {
            elapsed: true,
        }
    });

    return msToCups(lifetimeElapsed._sum.elapsed ? lifetimeElapsed._sum.elapsed : 0);
}

export function minutes(min: number): number {
    return min * 60 * 1000;
}

export function msToSeconds(ms: number): number {
    return Math.floor(ms / 1000);
}