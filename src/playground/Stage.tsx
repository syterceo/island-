import { APPS, Island, useIslandStore } from '@/island';
import { PlayIcon, WindowsLogoIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import css from './playground.module.css';

export type StageBg = 'desktop' | 'dark' | 'wallpaper' | 'light';

const BACKDROPS: StageBg[] = ['desktop', 'dark', 'wallpaper', 'light'];

const island = () => useIslandStore.getState();

const voiceChannel = () => ({ state: 'voice', joinedAt: Date.now() - 754_000, speaking: 0 });

const SCENES: { id: string; label: string; run: () => void }[] = [
  { id: 'idle', label: 'Idle', run: () => island().reset() },
  { id: 'music', label: 'Music', run: () => island().start('music') },
  { id: 'discord', label: 'Discord', run: () => island().start('discord', voiceChannel()) },
  {
    id: 'split',
    label: 'Two apps',
    run: () => {
      island().start('music');
      island().start('discord', voiceChannel());
    },
  },
  {
    id: 'expanded',
    label: 'Expanded',
    run: () => {
      island().start('music');
      island().expand('music');
    },
  },
  { id: 'recording', label: 'Recording', run: () => island().start('recording') },
  { id: 'voice', label: 'Dictation', run: () => island().start('voice') },
  { id: 'hub', label: 'Hub', run: () => island().expand() },
  { id: 'alert', label: 'Alert', run: () => island().show('notification') },
];

// Milliseconds after the previous step, then the step.
const TOUR: [number, () => void][] = [
  [0, () => island().reset()],
  [700, () => island().show('language')],
  [2100, () => island().start('music')],
  [1700, () => island().expand('music')],
  [2400, () => island().collapse()],
  [1100, () => island().show('volume', { level: 0.35 })],
  [450, () => island().show('volume', { level: 0.6 })],
  [450, () => island().show('volume', { level: 0.85 })],
  [2300, () => island().start('discord')],
  [2600, () => island().update('discord', { state: 'voice', joinedAt: Date.now(), speaking: 0 })],
  [0, () => island().collapse()],
  [2200, () => island().expand('discord')],
  [2800, () => island().collapse()],
  [1000, () => island().show('notification')],
  [4300, () => island().end('discord')],
  [900, () => island().start('recording')],
  [2400, () => island().show('screenshot')],
  [3400, () => island().reset()],
];

function useTour() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [running, setRunning] = useState(false);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
  };
  const play = () => {
    stop();
    setRunning(true);
    let at = 0;
    const scale = island().settings.timeScale;
    TOUR.forEach(([wait, step], index) => {
      at += wait * Math.max(1, scale);
      timers.current.push(
        setTimeout(() => {
          step();
          if (index === TOUR.length - 1) setRunning(false);
        }, at),
      );
    });
  };
  useEffect(() => stop, []);
  return { running, play, stop };
}

const TASKBAR_APPS = ['chrome', 'discord', 'spotify', 'telegram', 'steam'] as const;

/** A stand-in for the Windows desktop, so the island is judged where it will live. */
function Taskbar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className={css.taskbar}>
      <span className={css.taskbarApps}>
        <WindowsLogoIcon size={17} weight="fill" color="#4cc2ff" />
        {TASKBAR_APPS.map((id) => {
          const { icon: AppIcon, color } = APPS[id];
          return <AppIcon key={id} size={17} weight="fill" color={color} />;
        })}
      </span>
      <span className={css.taskbarClock}>
        <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        <span>{now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </span>
    </div>
  );
}

export function Stage({ bg, onBg }: { bg: StageBg; onBg: (bg: StageBg) => void }) {
  const [scene, setScene] = useState('idle');
  const tour = useTour();
  return (
    <>
      <div className={css.stage} data-bg={bg} data-island-stage>
        <Island />
        {bg === 'desktop' && <Taskbar />}
      </div>
      <div className={css.toolbar}>
        <div className={css.sceneBar}>
          {SCENES.map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={scene === item.id && !tour.running}
              onClick={() => {
                tour.stop();
                island().reset();
                item.run();
                setScene(item.id);
              }}
            >
              {scene === item.id && !tour.running && (
                <motion.span
                  layoutId="scene"
                  className={css.sceneThumb}
                  transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.18 }}
                />
              )}
              <span>{item.label}</span>
            </button>
          ))}
          <i />
          <button type="button" data-active={tour.running} onClick={tour.running ? tour.stop : tour.play}>
            <span className={css.tourLabel}>
              <PlayIcon size={11} weight="fill" /> {tour.running ? 'Stop' : 'Play tour'}
            </span>
          </button>
        </div>
        <span className={css.toolbarHint}>Click the island, or drop a file on it</span>
        <div className={css.bgSwitch}>
          {BACKDROPS.map((value) => (
            <button
              key={value}
              type="button"
              title={`${value} backdrop`}
              aria-label={`${value} backdrop`}
              data-bg={value}
              data-active={bg === value}
              onClick={() => onBg(value)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
