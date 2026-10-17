import { createApp } from './app.js';
import { readConfig } from './lib/config.js';
import { prisma } from './lib/prisma.js';

const config = readConfig();
await prisma.$connect();
const server = createApp(prisma, config).listen(config.PORT, () =>
  console.log(`API listening on port ${config.PORT}`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    });
  });
}
