import Airtable from "airtable";

Airtable.configure({
    apiKey: process.env.AIRTABLE_TOKEN
});

if (!process.env.AIRTABLE_BASE) { throw new Error("No Airtable base provided"); }

const base = Airtable.base(process.env.AIRTABLE_BASE);

export const users = base("Users");
// export const callLogs = base("Call Logs");
export const sessions = base("Sessions");
export const scraps = base("Scraps");