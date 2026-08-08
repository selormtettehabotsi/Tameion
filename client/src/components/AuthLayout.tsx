import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AUTH_IMAGE } from '../lib/images';
import Icon from './Icon';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Split layout shared by every authentication screen. */
export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Visual panel — decorative, so it is hidden from assistive tech */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden lg:flex">
        <img src={AUTH_IMAGE} alt="" width={1200} height={1600} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00301a]/90 via-[#00401f]/80 to-[#001b0d]/90" />
        <div className="relative z-10 max-w-md p-2xl text-center">
          <div className="mx-auto mb-xl grid h-20 w-20 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            <Icon name="book-open" size={38} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Tameion</h2>
          <p className="mt-md text-sm leading-relaxed text-white/80">
            The KNUST library, online. Search the catalogue, reserve titles and
            keep track of everything you have borrowed.
          </p>
          <div className="mt-xl grid grid-cols-3 gap-md text-white/70">
            {[
              { icon: 'library', label: 'Full catalogue' },
              { icon: 'landmark', label: 'Every branch' },
              { icon: 'users', label: 'One account' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-2xs">
                <Icon name={item.icon as 'library'} size={20} />
                <span className="text-2xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-md md:p-xl">
        <div className="flex w-full max-w-[440px] flex-col">
          <div className="mb-xl flex flex-col items-center text-center">
            <Link to="/catalog" className="mb-md grid h-16 w-16 place-items-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
              <Icon name="book-open" size={30} />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
            <p className="mt-2xs text-sm text-on-surface-variant">{subtitle}</p>
          </div>

          <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-lg shadow-sm md:p-xl">
            {children}
          </div>

          {footer && <div className="mt-lg flex flex-col items-center gap-sm text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
