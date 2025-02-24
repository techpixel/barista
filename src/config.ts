import { minutes } from "./util/math"

export const Config = {
    CAFE_CHANNEL: 'C08B55UP0T0',
    LOGS_CHANNEL: 'C08BTE4991P',
    BULLETIN_CHANNEL: 'C08CD0F2QBV',
}

export const Intervals = {
    PAUSE_CHECK: minutes(1),
    PAUSE_TIMEOUT: minutes(10),

    KICK_CHECK: minutes(5),
    KICK_AFTER: minutes(60),

    REMINDER_CHECK: minutes(5),
    REMIND_AFTER: minutes(45),

    HUDDLE_CHECK: minutes(1),
}

export const Commands = process.env.DEV ? {
    CUPS: '/test-cups',
    BOARD: '/test-board',
    HELP: '/test-help',
}: {
    CUPS: '/cups',
    BOARD: '/board',
    HELP: '/cafe-help',
}