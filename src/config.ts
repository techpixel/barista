const minutes = (minutes: number) => {
    return minutes * 60 * 1000; // --> milliseconds
}

export const Config = {
    CAFE_CHANNEL: 'C02A74Z7G7L',
    LOGS_CHANNEL: 'C08BTE4991P',

    CLEANUP_INTERVAL: minutes(5), // every 5 minutes

    AFTER_JOIN_TIMEOUT: minutes(10), // 10 minutes
    PAUSE_TIMEOUT: minutes(20), // 30 minutes 

    // this triggers the first reminder after a set number of minutes
    FIRST_REMINDER: minutes(5), // 5 minutes
    REMINDER_INTERVAL: minutes(30), // 30 minutes

    AFK_TIMEOUT: minutes(60), // 1 hour
}