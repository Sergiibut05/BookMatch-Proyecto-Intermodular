import { exec } from 'child_process';
import path from 'path';

export const getDashboardAnalytics = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'advanced_analytics.py');
    const pythonPath = process.platform === 'win32'
      ? path.resolve(process.cwd(), 'venv', 'Scripts', 'python.exe')
      : path.resolve(process.cwd(), 'venv', 'bin', 'python');
    
    // Ejecutamos con el python del entorno virtual
    exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        if (stderr) {
          console.error(`Python stderr: ${stderr}`);
        }
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

export const getTrafficAnalytics = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'ga4_analytics.py');
    const pythonPath = process.platform === 'win32'
      ? path.resolve(process.cwd(), 'venv', 'Scripts', 'python.exe')
      : path.resolve(process.cwd(), 'venv', 'bin', 'python');
    
    exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script (GA4): ${error.message}`);
        if (stderr) {
          console.error(`Python GA4 stderr: ${stderr}`);
        }
        return reject(error);
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse GA4 Python output:', stdout);
        reject(new Error('Invalid output format from GA4 Python script'));
      }
    });
  });
};
