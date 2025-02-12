import { parse } from 'yaml';
import fs from 'fs';

const file = fs.readFileSync('./src/util/transcript.yaml', 'utf8');
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

export function formatHour(milliseconds: number | undefined | null): string {
    if (!milliseconds) { return '0.0'; }

    const hours = milliseconds / 1000 / 60 / 60;

    return hours.toFixed(2);
}

const COLORS = ["r", "w"];

export function genProgressBar(maxLength: number, t: number): string {
    if (t < 0 || t > 1) {
        throw new Error("Progress bar value must be between 0 and 1");
    }
    if (maxLength <= 0) {
        throw new Error("Progress bar length must be greater than 0");
    }
    // t = 0 to 1
    // length > 0

    const length = maxLength * 4;
    const filledLength = Math.round(t * length);
    const bar = COLORS[0].repeat(filledLength) + COLORS[1].repeat(length - filledLength);

    let out = t > 0 ? `:pb-${COLORS[0]}-a:` : `:pb-${COLORS[1]}-a:`;

    for (let i = 0; i < length; i += 4) {
        out += `:pb-${bar.slice(i, i + 4)}:`;
    }

    out += t === 1 ? `:pb-${COLORS[0]}-z:` : `:pb-${COLORS[1]}-z:`;

    return out;
}