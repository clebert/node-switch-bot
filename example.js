// @ts-check

const {Adapter} = require('@clebert/node-bluez');
const {SwitchBot} = require('./lib/cjs');

Adapter.use(async (adapter) => {
  const switchBot = new SwitchBot(adapter, 'XX:XX:XX:XX:XX:XX');
  const properties = await switchBot.getProperties();

  console.log('Mode:', properties.mode);

  if (properties.mode === 'switch') {
    console.log('State:', properties.state);
  }

  console.log('Battery level (%):', properties.batteryLevel);

  await switchBot.press(); // mode: 'press'
  await switchBot.switch('on'); // mode: 'switch', state: 'on'
  await switchBot.switch('off'); // mode: 'switch', state: 'off'
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
