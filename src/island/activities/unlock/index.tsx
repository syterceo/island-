import { LockIcon, LockOpenIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { defineTransient } from '../../define';
import { T } from '../../i18n';
import { emitEffect } from '../../effects';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import { Swap, ui } from '../../ui/kit';

function View() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
      emitEffect('bump');
    }, scaled(520));
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={ui.compact} style={{ justifyContent: 'center' }}>
      <Swap id={open ? 'open' : 'locked'} dy={0}>
        {open ? (
          <LockOpenIcon size={18} weight="fill" color="var(--island-positive)" />
        ) : (
          <LockIcon size={18} weight="fill" />
        )}
      </Swap>
      <Swap id={open ? 'open' : 'locked'} className={ui.label}>
        <T>{open ? 'Welcome back' : 'Looking for you'}</T>
      </Swap>
    </div>
  );
}

export default defineTransient<Record<string, never>>({
  kind: 'unlock',
  title: 'Windows Hello',
  description: 'Sign in confirmation: the lock opens with a small bump.',
  icon: LockOpenIcon,
  defaultData: {},
  view: { size: { width: 178, height: COMPACT_HEIGHT }, Component: View },
  duration: 2000,
});
