import { Orchestrator } from './orchestrator.js';
import { hardReset } from './reset.js';

const args = process.argv.slice(2);

if (args.includes('--reset')) {
  hardReset().then(() => process.exit(0)).catch((err) => {
    console.error('[Reset] Fatal error:', err);
    process.exit(1);
  });
} else {
  const orchestrator = new Orchestrator();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Orchestrator] Shutting down gracefully...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await orchestrator.stop();
    process.exit(0);
  });

  // Start the company
  orchestrator.start().catch((err) => {
    console.error('[Orchestrator] Fatal error:', err);
    process.exit(1);
  });
}
