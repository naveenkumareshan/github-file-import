
const cron = require('node-cron');
const AutoPayoutService = require('./autoPayoutService');

class CronScheduler {
  static async init() {    
    // Run auto payout processing every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running auto payout processing cron job...');
      try {
        await AutoPayoutService.processAutoPayouts();
      } catch (error) {
        console.error('Auto payout cron job error:', error);
      }
    });
      await AutoPayoutService.processAutoPayouts();
    // Run auto payout processing every 6 hours for testing
    // cron.schedule('0 */6 * * *', async () => {
    //   console.log('Running auto payout processing (6-hour interval)...');
    //   try {
    //     await AutoPayoutService.processAutoPayouts();
    //   } catch (error) {
    //     console.error('Auto payout cron job error:', error);
    //   }
    // });

    console.log('Cron jobs initialized successfully');
  }
}

module.exports = CronScheduler;
