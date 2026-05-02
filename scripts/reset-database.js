import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const appDataDirectory = join(process.env.APPDATA, 'com.grovekeeper.app');

const databasePath = join(appDataDirectory, 'grovekeeper.db');
const walPath = databasePath + '-wal';
const shmPath = databasePath + '-shm';

for (const filePath of [databasePath, walPath, shmPath]) {
	if (existsSync(filePath)) {
		unlinkSync(filePath);
		console.log(`Deleted: ${filePath}`);
	}
}

console.log('Database reset. Restart the app to recreate it.');
