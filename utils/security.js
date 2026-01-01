const crypto = require('crypto');
const globalConfigs = require('../data/config.json');

const envPath = globalConfigs.remoteStartup ? '../remoteenv.json' : '../localenv.json';

const key = process.env.ENCRYPTION_KEY ?? (require(envPath)?.encryptionKey);
const iv = process.env.IV ?? (require(envPath)?.iv);

const keyBuffer = Buffer.from(key, 'hex');
const ivBuffer = Buffer.from(iv, 'hex');

/**@param {string} str*/
function encryptString(str) {
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    return cipher.update(str, 'utf8', 'base64') + cipher.final('base64');
}

/**@param {string} str*/
function decryptString(str) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    return decipher.update(str, 'base64', 'utf8') + decipher.final('utf8');
}

module.exports = {
	encryptString,
	decryptString,
};
