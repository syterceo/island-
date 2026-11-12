import { GlobeIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineTransient } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import { tween } from '../../motion/springs';
import type { ActivityViewProps } from '../../types';
import { ui } from '../../ui/kit';

interface LanguageData {
  langs: string[];
  /** Layout that was active before the switch. */
  from: number;
  active: number;
}

const SLOT = 38;

function View({ data }: ActivityViewProps<LanguageData>) {
  return (
    <div className={ui.compact} style={{ padding: '0 5px 0 11px' }}>
      <GlobeIcon size={18} weight="fill" />
      <span className={ui.langs}>
        <motion.span
          className={ui.langThumb}
          initial={{ x: data.from * SLOT }}
          animate={{ x: data.active * SLOT }}
          transition={tween(0.32, { delay: 0.12 })}
        />
        {data.langs.map((lang, index) => (
          <span key={lang} data-active={index === data.active}>
            {lang}
          </span>
        ))}
      </span>
    </div>
  );
}

export default defineTransient<LanguageData>({
  kind: 'language',
  title: 'Keyboard layout',
  description: 'Shows the input language when it is switched with Win + Space or Alt + Shift.',
  icon: GlobeIcon,
  defaultData: { langs: ['EN', 'RU'], from: 0, active: 1 },
  view: {
    size: (data) => ({ width: 50 + data.langs.length * SLOT, height: COMPACT_HEIGHT }),
    Component: View,
  },
  duration: 1500,
  demo: {
    presets: [
      { label: 'EN → RU', data: { langs: ['EN', 'RU'], from: 0, active: 1 } },
      { label: 'RU → EN', data: { langs: ['EN', 'RU'], from: 1, active: 0 } },
      { label: 'Three layouts', data: { langs: ['EN', 'RU', 'DE'], from: 0, active: 2 } },
    ],
  },
});
