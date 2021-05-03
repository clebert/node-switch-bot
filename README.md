# Node.js SwitchBot

[![][ci-badge]][ci-link] [![][version-badge]][version-link]
[![][license-badge]][license-link] [![][types-badge]][types-link]

[ci-badge]: https://github.com/clebert/node-switch-bot/workflows/CI/badge.svg
[ci-link]: https://github.com/clebert/node-switch-bot
[version-badge]: https://badgen.net/npm/v/@clebert/node-switch-bot
[version-link]: https://www.npmjs.com/package/@clebert/node-switch-bot
[license-badge]: https://badgen.net/npm/license/@clebert/node-switch-bot
[license-link]: https://github.com/clebert/node-switch-bot/blob/master/LICENSE
[types-badge]: https://badgen.net/npm/types/@clebert/node-switch-bot
[types-link]: https://github.com/clebert/node-switch-bot

> A Node.js API for
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
- Tested with Node.js 14 on Raspberry Pi OS Lite.

## Usage example

```js
import {Adapter} from '@clebert/node-bluez';
import {SystemDBus} from '@clebert/node-d-bus';
import {SwitchBot} from '@clebert/node-switch-bot';

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

      console.log('Battery level:', properties.batteryLevel);

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

---

Copyright (c) 2021, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/node-switch-bot/blob/master/LICENSE).
