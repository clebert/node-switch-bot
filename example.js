import {SwitchBot} from './lib/index.js';
import {Adapter} from '@clebert/node-bluez';

await Adapter.use(async (adapter) => {
  const switchBot = new SwitchBot(adapter, `XX:XX:XX:XX:XX:XX`);
  const properties = await switchBot.getProperties();

  console.log(`Mode:`, properties.mode);

  if (properties.mode === `switch`) {
    console.log(`State:`, properties.state);
  }

  console.log(`Battery level (%):`, properties.batteryLevel);

  await switchBot.press(); // mode: 'press'
  await switchBot.switch(`on`); // mode: 'switch', state: 'on'
  await switchBot.switch(`off`); // mode: 'switch', state: 'off'
});
