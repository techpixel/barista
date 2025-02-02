import { parse } from 'yaml';
import fs from 'fs';
import { prisma } from '../prisma.js';

type Template = string;

interface Data {
    slackId?: string,
    minutes?: number,
    repo?: string,
    main?: string,
    status?: string,
    reason?: string,
    url?: string,
}

interface ExtendedData extends Data {
    minutes_units?: string,
}

const file = fs.readFileSync('./src/util/templates.yaml', 'utf8');
const templatesRaw = parse(file);

function flatten(obj: any, prefix: string = '') {
    let result: any = {};

    for (const key in obj) {
        if (typeof obj[key] === 'object' && Array.isArray(obj[key]) === false) {
            result = { ...result, ...flatten(obj[key], `${prefix}${key}.`) }
        } else {
            result[`${prefix}${key}`] = obj[key];
        }
    }

    return result;
}

export const templates: {
    [key in Template]: string[]
} = flatten(templatesRaw);

export const pfps = {
    question: ":rac_question:",
    info: ":rac_info:",
    freaking: ":rac_freaking:",
    cute: ":rac_cute:",
    tinfoil: ":rac_believes_in_theory_about_green_lizards_and_space_lasers:",
    peefest: ":rac_peefest:",
    woah: ":rac_woah:",
    threat: ":rac_threat:",
    thumbs: ":rac_thumbs:",
    ded: ":rac_ded:"
};

export function t(template: Template, data: Data | null = null) {
//    return (randomChoice(templates[template]) as string).replace(/\${(.*?)}/g, (_, key) => (data as any)[key])
    if (!data) {
        return t_fetch(template);
    }
    
    return t_format(t_fetch(template), data);
}

export function t_fetch(template: Template) {
    return (randomChoice(templates[template]) as string);
}

export function t_format(template: string, data: Data) {
    const extendedData = {
        ...data,
        minutes_units: data.minutes == 1 ? 'minute' : 'minutes',
    }
    return template.replace(/\${(.*?)}/g, (_, key) => (extendedData as any)[key])
}

export function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export function formatHour(minutes: number | undefined | null): string {
    if (!minutes) { return '0.0'; }

    const hours = minutes / 60

    return hours.toFixed(2);
}