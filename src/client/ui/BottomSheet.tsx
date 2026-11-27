import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LazyMotion, MotionConfig, m } from 'motion/react';
import { X } from 'lucide-react';
import { MOTION_SPRINGS } from '../core/motion/tokens';

const loadDomAnimation = () =>
  import('../core/motion/domAnimation').then((mod) => mod.default);

interface BottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

const DISMISS_THRESHOLD_PX = 110;
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BottomSheet({ open, title, subtitle, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [keyboardOffsetPx, setKeyboardOffsetPx] = useState(0);

  useEffect(() => {
    if (!open) {
      setDragOffsetY(0);
      setKeyboardOffsetPx(0);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffsetPx(offset);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, event.clientY - dragStartY.current);
    setDragOffsetY(delta);
  };

  const handlePointerUp = () => {
    if (dragStartY.current === null) return;
    const shouldDismiss = dragOffsetY >= DISMISS_THRESHOLD_PX;
    dragStartY.current = null;
    setDragOffsetY(0);
    if (shouldDismiss) {
      onClose();
    }
  };

  return createPortal(
    <LazyMotion features={loadDomAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-md sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={keyboardOffsetPx > 0 ? { paddingBottom: `${keyboardOffsetPx}px` } : undefined}
          onClick={onClose}
        >
          <m.div
            ref={sheetRef}
            initial={{ y: 64, opacity: 0.9, scale: 0.985 }}
            animate={{ y: dragOffsetY, opacity: 1, scale: 1 }}
            transition={dragOffsetY > 0 ? { duration: 0 } : MOTION_SPRINGS.sheet}
            className="safe-bottom flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-[28px] border border-line-strong bg-[#14100d] shadow-[0_-18px_64px_-12px_rgb(0_0_0/0.85),inset_0_1px_0_rgb(255_241_214/0.08)] sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="flex cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing sm:hidden"
            >
              <div className="h-1.5 w-11 rounded-full bg-white/20" />
            </div>

            <div className="flex items-start justify-between gap-3 px-6 pt-3 pb-4 sm:pt-6">
              <div className="min-w-0">
                <h2
                  dir="auto"
                  className="font-display text-[22px] font-medium leading-tight tracking-[-0.02em] text-ink"
                >
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-[13px] leading-snug text-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="-me-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] text-ink-soft transition-[transform,background-color,color] duration-150 hover:bg-white/[0.15] hover:text-ink active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-6 h-px bg-line" />
            <div className="overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
          </m.div>
        </m.div>
      </MotionConfig>
    </LazyMotion>,
    document.body,
  );
}
