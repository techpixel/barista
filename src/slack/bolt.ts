import { App, ExpressReceiver } from '@slack/bolt';
import { Config } from '../config';

const expressReciever = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  endpoints: '/slack/events',
})

expressReciever.app.get('/health', async (req, res) => {
  await app.client.chat.postMessage({
    channel: Config.LOGS_CHANNEL,
    text: 'recieved health check!'
  });

  res.sendStatus(200);
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});



export { app };