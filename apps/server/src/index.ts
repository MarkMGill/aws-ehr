import { createApp } from './app.js';
import { config } from './config/env.js';
import { sequelize } from './database/sequelize.js';

const server = createApp().listen(config.port, () => {
  console.log(`AWS EHR API running on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => { void sequelize.close(); });
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
