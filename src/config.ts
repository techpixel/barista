import { minutes } from "./util/math"

export const Config = {
    CAFE_CHANNEL: 'C08B55UP0T0',
    LOGS_CHANNEL: 'C08BTE4991P',
}

export const Intervals = {
    PAUSE_CHECK: minutes(1),
    PAUSE_TIMEOUT: minutes(10),

    KICK_CHECK: minutes(5),
    KICK_AFTER: minutes(10),

    REMINDER_CHECK: minutes(5),
    REMIND_AFTER: minutes(45),

    HUDDLE_CHECK: minutes(1),
}