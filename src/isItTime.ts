const endTime = new Date('2025-02-18T00:00:00.000Z');

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

function whisper(arg0: { user: any; text: string; }) {
    throw new Error("Function not implemented.");
}
