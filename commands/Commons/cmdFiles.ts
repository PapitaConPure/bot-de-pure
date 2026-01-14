import { readdirSync } from 'node:fs';

export const commandFilenames = readdirSync('./commands/Instances')
	.filter(file => /\.(js|ts)$/.test(file))
	.map(file => file.replace(/\.(js|ts)$/, ''));
