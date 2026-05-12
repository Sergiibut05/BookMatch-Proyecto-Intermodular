import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { platform } from 'os';
import { join } from 'path';

const isWindows = platform() === 'win32';
const venvDir = 'venv';
const pipPath = isWindows
  ? join(venvDir, 'Scripts', 'pip.exe')
  : join(venvDir, 'bin', 'pip');

if (!existsSync(venvDir)) {
  console.log('Creating Python virtual environment...');
  try {
    execSync('python -m venv venv', { stdio: 'inherit' });
  } catch (error) {
    if (!isWindows) {
      console.log('python not found, trying python3...');
      execSync('python3 -m venv venv', { stdio: 'inherit' });
    } else {
      throw error;
    }
  }
}

console.log('Installing Python dependencies...');
execSync(`"${pipPath}" install -r requirements.txt`, { stdio: 'inherit' });
