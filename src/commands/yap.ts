import { app } from "../slack/bolt";
import huddleKick from "../slack/huddleKick";
import { prisma } from "../util/prisma";

app.command('/yap', async ({ ack, payload }) => {
    await ack();


});