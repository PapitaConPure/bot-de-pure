import { createCipheriv, createDecipheriv } from 'crypto';
import { envPath } from '../data/globalProps';

const key = process.env.ENCRYPTION_KEY ?? (require(envPath)?.encryptionKey);
const iv = process.env.IV ?? (require(envPath)?.iv);

const keyBuffer = Buffer.from(key, 'hex');
const ivBuffer = Buffer.from(iv, 'hex');

export function encryptString(str: string) {
	const cipher = createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
	return cipher.update(str, 'utf8', 'base64') + cipher.final('base64');
}

export function decryptString(str: string) {
	const decipher = createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
	return decipher.update(str, 'base64', 'utf8') + decipher.final('utf8');
}
