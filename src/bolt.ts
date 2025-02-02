import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: `7b5969ce460e83939076332fe586973c` //process.env.SLACK_SIGNING_SECRET
});

export { app };