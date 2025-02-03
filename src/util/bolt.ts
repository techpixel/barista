import { App } from '@slack/bolt';
import { config } from './transcript';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// error logging
export async function error(error: Error, slackId: string, channelId: string | undefined = undefined) {
  app.logger.error(error);

  await app.client.chat.postEphemeral({
      channel: channelId ?? slackId,
      user: slackId,
      text: `An error occurred: ${error.message}` //todo: better error message
  });    
}

export async function mirrorMessage({ message, user, channel, type }: {
    message: string,
    user: string,
    channel: string,
    type: string
}) {
    // try {
    //   const context = `a ${type} from <@${user}> in <#${channel}>`
    //   await app.client.chat.postMessage({
    //     channel: config.LOGS_CHANNEL,
    //     text: context,
    //     blocks: [
    //       {
    //         type: 'section',
    //         text: {
    //           type: 'mrkdwn',
    //           text: `> ${message}`,
    //         },
    //       },
    //       {
    //         type: 'context',
    //         elements: [
    //           {
    //             type: 'mrkdwn',
    //             text: context,
    //           },
    //         ],
    //       },
    //     ],
    //   })
    // } catch (e) {
    //   console.error(e)
    // }
}

// huddles.info
const headers = new Headers();
const headerData = JSON.parse(process.env.HEADERS!) as { [key: string]: string };

for (const key in headerData) {
    headers.append(key, headerData[key]);
}

const body = JSON.stringify({
    "token": process.env.SLACK_CLIENT_TOKEN,
    "channel_ids": [config.CAFE_CHANNEL],
});

export type Huddle = {
    channel_id: string,
    call_id: string,
    active_members: string[],
    dropped_members: string[],
    background_id: string,
    thread_root_ts: string,
    created_by: string,
    start_date: number,
    recording: {
        can_record_summary: string,
    },
    expiration: number,
    locale: string,
}

export function huddleInfo(): Promise<{ huddles: Huddle[] } | undefined> {
    return fetch("https://edgeapi.slack.com/cache/T0266FRGM/huddles/info?_x_app_name=client&fp=f5&_x_num_retries=0", {
        method: "POST",
        headers,
        body,
        redirect: "follow"
      })
      .then((response) => response.json())
      .catch((error) => console.error(error));
}

export { app };