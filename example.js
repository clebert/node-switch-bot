// @ts-check

const {SystemDBus} = require('@clebert/node-d-bus');
const {Bot} = require('./lib/cjs');

(async () => {
  const dBus = new SystemDBus();

  await dBus.connectAsExternal();

  try {
    await dBus.hello();

    const bot = new Bot(dBus, 'XX:XX:XX:XX:XX:XX', {operationTimeout: 5000});
    const properties = await bot.getProperties();

    console.log('Mode:', properties.mode);

    if (properties.mode === 'switch') {
      console.log('State:', properties.state);
    }

    console.log('Battery level:', properties.batteryLevel);

    await bot.press(); // mode: 'press'
    await bot.switch('on'); // mode: 'switch', state: 'on'
    await bot.switch('off'); // mode: 'switch', state: 'off'
  } finally {
    dBus.disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
