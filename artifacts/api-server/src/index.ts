import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";
import { ensureTables } from "./lib/ensureTables";

const rawPort = process.env["PORT"];

const port = rawPort ? Number(rawPort) : 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

startScheduler();

// New tables (sponsored products, deal usage) are created idempotently before
// accepting traffic — cost-bearing routes depend on them (usage tracking fails
// closed, so a race here would wrongly reject Pro deal searches at boot).
ensureTables()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "ensureTables failed at boot — not starting");
    process.exit(1);
  });
