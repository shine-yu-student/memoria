import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shell } from './shell/Shell';
import { TopBar } from './shell/TopBar';
import { NavRail, type ModernaTab } from './shell/NavRail';
import { MotionRoot } from './motion/MotionRoot';
import { useMotionKit } from './motion/useMotionKit';
import { ToastProvider } from './ui/ToastProvider';
import { ConfirmProvider } from './ui/ConfirmDialog';
import { ModernSettingsProvider, useModernSettings } from './settings/ModernSettingsProvider';
import { SettingsPanel } from './settings/SettingsPanel';
import { ChineseModule } from './chinese/ChineseModule';
import { EnglishModule } from './english/EnglishModule';
import './styles/tokens.css';

interface Props {
  dataVersion?: number;
  onDataChanged?: () => void;
}

const TAB_ORDER: ModernaTab[] = ['chinese', 'english'];

/**
 * 新界面（Moderna）根组件。
 *
 * 层级：设置 Provider → MotionRoot → Toast/Confirm 宿主 → Shell。
 * Toast 与 Confirm 刻意放在所有 AnimatePresence 边界之外，
 * 否则关闭一个 Toast 会卷入页面转场动画。
 */
export const ModernaApp: React.FC<Props> = props => (
  <ModernSettingsProvider>
    <ModernaAppInner {...props} />
  </ModernSettingsProvider>
);

const ModernaAppInner: React.FC<Props> = ({ dataVersion = 0, onDataChanged }) => {
  const [tab, setTab] = useState<ModernaTab>('chinese');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const kit = useMotionKit();
  // 命名为 motionPref：避免与 framer-motion 的 motion 同名而被遮蔽
  const { motion: motionPref } = useModernSettings();

  // 方向由标签顺序推导，存 ref 以便退场期间仍可读到
  const prevTabRef = React.useRef<ModernaTab>(tab);
  const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(prevTabRef.current) ? 1 : -1;
  React.useEffect(() => {
    prevTabRef.current = tab;
  }, [tab]);

  return (
    <MotionRoot preference={motionPref}>
      <ToastProvider>
        <ConfirmProvider>
          <Shell
            topBar={<TopBar onOpenSettings={() => setSettingsOpen(true)} />}
            rail={<NavRail active={tab} onChange={setTab} />}
          >
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={tab}
                custom={dir}
                variants={kit.tab}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ height: '100%' }}
              >
                {tab === 'chinese' ? (
                  <ChineseModule dataVersion={dataVersion} onDataChanged={() => onDataChanged?.()} />
                ) : (
                  <EnglishModule dataVersion={dataVersion} onDataChanged={() => onDataChanged?.()} />
                )}
              </motion.div>
            </AnimatePresence>
          </Shell>

          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onDataChanged={() => onDataChanged?.()}
          />
        </ConfirmProvider>
      </ToastProvider>
    </MotionRoot>
  );
};
