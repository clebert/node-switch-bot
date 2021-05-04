// @ts-check

const {Adapter} = require('@clebert/node-bluez');
const {SystemDBus} = require('@clebert/node-d-bus');
const {SwitchBot} = require('./lib/cjs');

(async () => {
  const dBus = new SystemDBus();

  await dBus.connectAsExternal();

  try {
    await dBus.hello();

    const [adapter] = await Adapter.getAll(dBus);

    if (!adapter) {
      throw new Error('Adapter not found.');
    }

    const switchBot = new SwitchBot(adapter, 'XX:XX:XX:XX:XX:XX');
    const unlockAdapter = await adapter.lock.aquire();

    try {
      const properties = await switchBot.getProperties();

      console.log('Mode:', properties.mode);

      if (properties.mode === 'switch') {
        console.log('State:', properties.state);
      }

      console.log('Battery level (%):', properties.batteryLevel);

      await switchBot.press(); // mode: 'press'
      await switchBot.switch('on'); // mode: 'switch', state: 'on'
      await switchBot.switch('off'); // mode: 'switch', state: 'off'
    } finally {
      unlockAdapter();
    }
  } finally {
    dBus.disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
