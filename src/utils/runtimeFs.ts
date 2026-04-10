import { fileURLToPath } from 'url';
import { readdirSync, readFileSync, promises as fsPromises } from 'fs';
import { dirname, join } from 'path';

export function resolveFrom(importMetaUrl: string, ...paths: string[]): string {
	const dir = dirname(fileURLToPath(importMetaUrl));
	return join(dir, ...paths);
}

export function readdirFromSync(importMetaUrl: string, ...paths: string[]): string[] {
	const fullPath = resolveFrom(importMetaUrl, ...paths);
	return readdirSync(fullPath);
}

export async function readdirFrom(importMetaUrl: string, ...paths: string[]): Promise<string[]> {
	const fullPath = resolveFrom(importMetaUrl, ...paths);
	return fsPromises.readdir(fullPath);
}

export function readFileFromSync(importMetaUrl: string, ...paths: string[]): Buffer<ArrayBufferLike> {
	const fullPath = resolveFrom(importMetaUrl, ...paths);
	return readFileSync(fullPath);
}

export async function readFileFrom(importMetaUrl: string, ...paths: string[]): Promise<Buffer<ArrayBufferLike>> {
	const fullPath = resolveFrom(importMetaUrl, ...paths);
	return fsPromises.readFile(fullPath);
}

export function getModuleNames(files: string[]): string[] {
	return files
		.filter(file => /\.(js|ts)$/.test(file))
		.map(file => file.replace(/\.(js|ts)$/, ''));
}
