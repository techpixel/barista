import Airtable from "airtable";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { error } from "./bolt";

Airtable.configure({
    apiKey: process.env.AIRTABLE_TOKEN
});

if (!process.env.AIRTABLE_BASE) { throw new Error("No Airtable base provided"); }

const base = Airtable.base(process.env.AIRTABLE_BASE);

export const users = base("Users");
export const callLogs = base("Call Logs");
