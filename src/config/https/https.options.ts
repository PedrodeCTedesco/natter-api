import * as fs from 'fs';
import * as path from 'path';

const findCertificatePath = (filename: string): string => {
  const possiblePaths = [
    path.resolve(__dirname, '../config/certificates', filename),
    path.resolve(__dirname, 'config/certificates', filename),
    path.resolve(__dirname, '../certificates', filename),
    path.resolve(__dirname, 'certificates', filename),
    path.resolve(process.cwd(), 'src/config/certificates', filename),
    path.resolve(process.cwd(), 'config/certificates', filename)
  ];

  for (const certPath of possiblePaths) {
    if (fs.existsSync(certPath)) {
      return certPath;
    }
  }

  throw new Error(`Certificate file ${filename} not found in any of the expected locations`);
};

export const httpsOptions = {
  key: fs.readFileSync(findCertificatePath('key.pem')),
  cert: fs.readFileSync(findCertificatePath('cert.pem')),
};

// Adicione um log para debug
console.log('Certificate paths:', {
  key: findCertificatePath('key.pem'),
  cert: findCertificatePath('cert.pem')
});