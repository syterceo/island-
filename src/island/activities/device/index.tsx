import { GameControllerIcon, HeadphonesIcon, type Icon, UsbIcon, WifiHighIcon } from '@phosphor-icons/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import type { ActivityViewProps } from '../../types';
import { cx, DrawnMark, ProgressRing, ui } from '../../ui/kit';

type DeviceType = 'headphones' | 'controller' | 'usb' | 'wifi';

interface DeviceData {
  type: DeviceType;
  name: string;
  /** 0 to 1, or null for devices without a battery. */
  battery: number | null;
}

const ICONS: Record<DeviceType, Icon> = {
  headphones: HeadphonesIcon,
  controller: GameControllerIcon,
  usb: UsbIcon,
  wifi: WifiHighIcon,
};

function View({ data }: ActivityViewProps<DeviceData>) {
  const DeviceIcon = ICONS[data.type] ?? HeadphonesIcon;
  return (
    <div className={ui.compact} style={{ padding: '0 9px 0 11px' }}>
      <span className={ui.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <DeviceIcon size={18} weight="fill" style={{ flex: 'none' }} />
        <span className={ui.truncate}>{data.name}</span>
      </span>
      {data.battery === null ? (
        <DrawnMark />
      ) : (
        <ProgressRing value={data.battery} size={22} stroke={2.5} color="var(--island-positive)">
          <span className={cx(ui.num)} style={{ fontSize: 8, fontWeight: 800 }}>
            {Math.round(data.battery * 100)}
          </span>
        </ProgressRing>
      )}
    </div>
  );
}

export default defineTransient<DeviceData>({
  kind: 'device',
  title: 'Device connected',
  description: 'Headphones, a controller, a USB drive or a network, with battery where there is one.',
  icon: HeadphonesIcon,
  defaultData: { type: 'headphones', name: 'WH-1000XM5', battery: 0.86 },
  view: {
    size: (data) => ({ width: Math.min(320, 92 + data.name.length * 7.6), height: COMPACT_HEIGHT }),
    Component: View,
  },
  duration: 2600,
  demo: {
    presets: [
      { label: 'Headphones', data: { type: 'headphones', name: 'WH-1000XM5', battery: 0.86 } },
      { label: 'Controller', data: { type: 'controller', name: 'Xbox Controller', battery: 0.4 } },
      { label: 'USB drive', data: { type: 'usb', name: 'SanDisk 64 GB', battery: null } },
      { label: 'Wi-Fi', data: { type: 'wifi', name: 'Home 5G', battery: null } },
    ],
  },
});
