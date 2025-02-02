import dotenv from 'dotenv';
dotenv.config();

const headers = new Headers();
const headerData = JSON.parse(process.env.HEADERS!) as { [key: string]: string };

for (const key in headerData) {
    headers.append(key, headerData[key]);
}

const body = JSON.stringify({
    "token": process.env.SLACK_CLIENT_TOKEN,
    "channel_ids": ["C08B55UP0T0"]
});

type Huddle = {
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