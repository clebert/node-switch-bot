import {Adapter, Device, timeout} from '@clebert/node-bluez';
import {DBus} from '@clebert/node-d-bus';

export interface BotOptions {
  readonly adapterAddress?: string;
  readonly operationTimeout?: number;
  readonly pollInterval?: number;
}

export type BotProperties =
  | {
      readonly mode: 'press';
      readonly batteryLevel: number;
    }
  | {
      readonly mode: 'switch';
      readonly state: 'on' | 'off';
      readonly batteryLevel: number;
    };

export class Bot {
  readonly #dBus: DBus;
  readonly #deviceAddress: string;
  readonly #options: BotOptions;

  constructor(dBus: DBus, deviceAddress: string, options: BotOptions = {}) {
    this.#dBus = dBus;
    this.#deviceAddress = deviceAddress;
    this.#options = options;
  }

  async getProperties(): Promise<BotProperties> {
    const serviceData = await this.#findServiceData();
    const mode = Boolean((serviceData[1] ?? 0) & 0b10000000);
    const state = Boolean((serviceData[1] ?? 0) & 0b01000000);
    const batteryLevel = (serviceData[2] ?? 0) & 0b01111111;

    return mode
      ? {mode: 'switch', state: state ? 'off' : 'on', batteryLevel}
      : {mode: 'press', batteryLevel};
  }

  async press(): Promise<void> {
    const properties = await this.getProperties();

    if (properties.mode === 'switch') {
      await this.#sendCommand([0x57, 0x03, 0x64, 0x00]);
    } else {
      await this.#sendCommand([0x57, 0x01, 0x00]);
    }
  }

  async switch(state: 'on' | 'off'): Promise<void> {
    const properties = await this.getProperties();

    if (properties.mode === 'press') {
      await this.#sendCommand([0x57, 0x03, 0x64, 0x10]);
    }

    if (state === 'on') {
      await this.#sendCommand([0x57, 0x01, 0x01]);
    } else {
      await this.#sendCommand([0x57, 0x01, 0x02]);
    }
  }

  readonly #findDevice = async (): Promise<Device> => {
    const [adapter] = await Adapter.getAll(
      this.#dBus,
      this.#options.adapterAddress
    );

    if (!adapter) {
      throw new Error('Adapter not found.');
    }

    await adapter.setPowered(true);

    await adapter.setDiscoveryFilter({
      serviceUUIDs: ['cba20d00-224d-11e6-9fb8-0002a5d5c51b'],
      transport: 'le',
    });

    const [device] = await adapter.getDevices(this.#deviceAddress);

    if (device) {
      await adapter.removeDevice(device);
    }

    await adapter.startDiscovery();

    try {
      return await timeout(
        adapter.waitForDevice(this.#deviceAddress, {
          pollInterval: this.#options.pollInterval,
          resolveServiceData: true,
        }),
        this.#options.operationTimeout ?? Number.MAX_SAFE_INTEGER
      );
    } finally {
      await adapter.stopDiscovery();
    }
  };

  readonly #findServiceData = async (): Promise<readonly number[]> => {
    const device = await this.#findDevice();

    const serviceData = (await device.getServiceData())?.[
      '00000d00-0000-1000-8000-00805f9b34fb'
    ];

    if (!serviceData) {
      throw new Error('Service data not found.');
    }

    return serviceData;
  };

  readonly #sendCommand = async (bytes: readonly number[]): Promise<void> => {
    const device = await this.#findDevice();

    await timeout(
      device.connect(),
      this.#options.operationTimeout ?? Number.MAX_SAFE_INTEGER
    );

    try {
      const writeCharacteristic = await timeout(
        device.waitForGattCharacteristic(
          'cba20002-224d-11e6-9fb8-0002a5d5c51b',
          {pollInterval: this.#options.pollInterval}
        ),
        this.#options.operationTimeout ?? Number.MAX_SAFE_INTEGER
      );

      await writeCharacteristic.writeValue(bytes);
    } finally {
      await device.disconnect();
    }
  };
}
