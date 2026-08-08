import type { ReactNode } from 'react';
import Icon, { type IconName } from '../Icon';

type Tone = 'info' | 'warning' | 'danger' | 'success';

const tones: Record<Tone, { wrap: string; icon: IconName }> = {
  info: { wrap: 'bg-primary-container text-on-primary-container', icon: 'info' },
  warning: { wrap: 'bg-warning-container text-on-warning-container', icon: 'triangle-alert' },
  danger: { wrap: 'bg-danger-container text-on-danger-container', icon: 'triangle-alert' },
  success: { wrap: 'bg-success-container text-on-success-container', icon: 'circle-check' },
};

interface Props {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export default function Alert({ tone = 'info', title, children, action }: Props) {
  const { wrap, icon } = tones[tone];
  return (
    <div role="status" className={`flex items-start gap-sm rounded-md px-md py-sm ${wrap}`}>
      <Icon name={icon} size={18} className="mt-3xs" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="mt-3xs text-xs opacity-90">{children}</div>}
      </div>
      {action}
    </div>
  );
}
