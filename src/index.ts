import {Adapter, Device} from '@clebert/node-bluez';

export interface SwitchBotOptions {
  /** Default: `50` milliseconds (ms) */
  readonly pollInterval?: number;
}

export type SwitchBotProperties =
  | {
      readonly mode: 'press';

      /** Battery level in percent (%) */
      readonly batteryLevel: number;
    }
  | {
      readonly mode: 'switch';
      readonly state: 'on' | 'off';

      /** Battery level in percent (%) */
      readonly batteryLevel: number;
    };

export class SwitchBot {
  readonly #adapter: Adapter;
  readonly #deviceAddress: string;
  readonly #options: SwitchBotOptions;

  constructor(
    adapter: Adapter,
    deviceAddress: string,
    options: SwitchBotOptions = {}
  ) {
    this.#adapter = adapter;
    this.#deviceAddress = deviceAddress;
    this.#options = options;
  }

  async getProperties(device?: Device): Promise<SwitchBotProperties> {
    const serviceData = await this.#getServiceData(
      device ?? (await this.#findDevice())
    );

    const mode = Boolean((serviceData[1] ?? 0) & 0b10000000);
    const state = Boolean((serviceData[1] ?? 0) & 0b01000000);
    const batteryLevel = (serviceData[2] ?? 0) & 0b01111111;

    return mode
      ? {mode: 'switch', state: state ? 'off' : 'on', batteryLevel}
      : {mode: 'press', batteryLevel};
  }

  async press(): Promise<void> {
    const device = await this.#findDevice();
    const properties = await this.getProperties(device);

    if (properties.mode === 'switch') {
      await this.#sendCommand(device, [0x57, 0x03, 0x64, 0x00]);
    } else {
      await this.#sendCommand(device, [0x57, 0x01, 0x00]);
    }
  }

  async switch(state: 'on' | 'off'): Promise<void> {
    const device = await this.#findDevice();
    const properties = await this.getProperties(device);

    if (properties.mode === 'press') {
      await this.#sendCommand(device, [0x57, 0x03, 0x64, 0x10]);
    }

    if (state === 'on') {
      await this.#sendCommand(device, [0x57, 0x01, 0x01]);
    } else {
      await this.#sendCommand(device, [0x57, 0x01, 0x02]);
    }
  }

  readonly #findDevice = async (): Promise<Device> => {
    await this.#adapter.setPowered(true);

    const [device] = await this.#adapter.getDevices(this.#deviceAddress);

    if (device) {
      await this.#adapter.removeDevice(device);
    }

    await this.#adapter.startDiscovery();

    try {
      return await this.#adapter.waitForDevice(this.#deviceAddress, {
        pollInterval: this.#options.pollInterval,
        resolveServiceData: true,
      });
    } finally {
      await this.#adapter.stopDiscovery();
    }
  };

  readonly #getServiceData = async (
    device: Device
  ): Promise<readonly number[]> => {
    const serviceData = (await device.getServiceData())?.[
      '00000d00-0000-1000-8000-00805f9b34fb'
    ];

    if (!serviceData) {
      throw new Error('Service data not found.');
    }

    return serviceData;
  };

  readonly #sendCommand = async (
    device: Device,
    bytes: readonly number[]
  ): Promise<void> => {
    await device.connect();

    try {
      const writeCharacteristic = await device.waitForGattCharacteristic(
        'cba20002-224d-11e6-9fb8-0002a5d5c51b',
        {pollInterval: this.#options.pollInterval}
      );

      await writeCharacteristic.writeValue(bytes);
    } finally {
      await device.disconnect();
    }
  };
}
