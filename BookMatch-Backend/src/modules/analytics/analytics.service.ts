import { exec } from 'child_process';
import path from 'path';

export const getInventoryAnalytics = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'inventory_analytics.py');
    const pythonPath = path.resolve(process.cwd(), 'venv', 'bin', 'python');
    
    // Ejecutamos con el python del entorno virtual
    exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return reject(error);
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse Python output:', stdout);
        reject(new Error('Invalid output format from Python script'));
      }
    });
  });
};
