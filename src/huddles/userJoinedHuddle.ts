import { mirrorMessage } from "../slack/logger";
import { t } from "../util/transcript";
import { Config } from "../config";

import { whisper } from "../slack/whisper";

/*

User joins call -> bot asks user to post goal/scrap

*/

export default async (args: {
    slackId: string,
}) => {
    console.log(`User ${args.slackId} joined the huddle`);

    mirrorMessage({
        message: `${args.slackId} joined the huddle`,
        user: args.slackId,
        channel: Config.CAFE_CHANNEL,
        type: 'huddle_join'
    });

    whisper({
        channel: Config.CAFE_CHANNEL,
        user: args.slackId,
        text: t('huddle_join')
    });

    console.log(`bot asked what they're working on`)
}