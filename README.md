# Node.js SwitchBot

> A Node.js API for the
> [SwitchBot](https://www.switch-bot.com/products/switchbot-bot) with native
> TypeScript support.

This package runs only on Linux and uses BlueZ and D-Bus under the hood.

## Installation

```
npm install @clebert/node-switch-bot @clebert/node-bluez @clebert/node-d-bus
```

## Features

- Designed from the ground up with TypeScript.
- Supports reading and writing the `press`/`switch` mode.
- Supports reading and writing the `on`/`off` switch state.
- Supports reading the battery level.

## Usage example

```js
import {Adapter} from '@clebert/node-bluez';
import {SwitchBot} from '@clebert/node-switch-bot';

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
```

## Configure D-Bus user permissions

Create the `/etc/dbus-1/system.d/node-bluez.conf` configuration file. The
username may need to be modified.

```xml
<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">

<busconfig>
  <policy user="pi">
    <allow own="org.bluez"/>
    <allow send_destination="org.bluez"/>
    <allow send_interface="org.bluez.GattCharacteristic1"/>
    <allow send_interface="org.bluez.GattDescriptor1"/>
    <allow send_interface="org.freedesktop.DBus.ObjectManager"/>
    <allow send_interface="org.freedesktop.DBus.Properties"/>
  </policy>
</busconfig>
```
