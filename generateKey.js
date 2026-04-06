import { randomBytes } from 'crypto';
import readline from 'readline';

const key = randomBytes(32).toString('hex');
const iv = randomBytes(16).toString('hex');

console.log('Variables generadas:');
console.log('- '.repeat(8));
console.log(`ENCRYPTION_KEY=${key}`);
console.log(`IV=${iv}`);
console.log('- '.repeat(8));

console.log('\nCopia y pega estos valores en tu .env (busca en Internet cómo copiar texto en tu terminal)');
console.log('\nPresiona ENTER para terminar este proceso...');

async function readln() {
	await new Promise(resolve => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question('', () => {
			rl.close();
			resolve();
		});
	});
}

readln();
