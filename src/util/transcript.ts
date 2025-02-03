import { parse } from 'yaml';
import fs from 'fs';

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

type Data = { [key: string]: any };

export const templates: {
    [key: string]: string[]
} = flatten(templatesRaw['templates']);

export const config: {
    [key: string]: string,
} = templatesRaw['config'];

export function t(template: string, data: Data | null = null) {
    if (!data) {
        return t_fetch(template);
    }
    
    return t_format(t_fetch(template), data);
}

export function t_fetch(template: string) {
    return (randomChoice(templates[template]) as string);
}

export function t_format(template: string, data: Data) {
    return template.replace(/\${(.*?)}/g, (_, key) => (data)[key])
}

export function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export function formatHour(minutes: number | undefined | null): string {
    if (!minutes) { return '0.0'; }

    const hours = minutes / 60

    return hours.toFixed(2);
}