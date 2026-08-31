import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { AppearanceSection } from './AppearanceSection';
import { DataSection } from './DataSection';
import s from './SettingsPanel.module.css';

type Category = 'appearance' | 'data';

const CATEGORIES: { key: Category; icon: string; label: string }[] = [
  { key: 'appearance', icon: '🎨', label: '外观' },
  { key: 'data', icon: '📦', label: '数据' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsPanel: React.FC<Props> = ({ open, onClose, onDataChanged }) => {
  const [category, setCategory] = useState<Category>('appearance');

  return (
    <Modal open={open} title="设置" wide onClose={onClose}>
      <div className={s.layout}>
        <div className={s.categories}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`${s.category} ${category === c.key ? s.categoryActive : ''}`}
              onClick={() => setCategory(c.key)}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className={s.content}>
          {category === 'appearance' ? (
            <AppearanceSection />
          ) : (
            <DataSection onDataChanged={onDataChanged} />
          )}
        </div>
      </div>
    </Modal>
  );
};
