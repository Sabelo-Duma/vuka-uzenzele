import { useEffect, useState } from 'react';

/**
 * Is the on-screen keyboard up?
 *
 * Needed because nothing in CSS will tell you. Since Chrome 108 both Android
 * and iOS resize only the **visual** viewport when the keyboard appears and
 * leave the layout viewport alone — so `100dvh` does not shrink, `position:
 * fixed` does not move, and a bar pinned to the bottom of the shell stays
 * exactly where it was, wedged between the message box and the keyboard.
 *
 * Which is the bug this exists to fix: typing a reply on a phone, with Home /
 * Find work / Chats sitting on top of the conversation for no reason.
 *
 * The signal is the gap between the two viewports. It is the right one because
 * it measures the keyboard rather than inferring it:
 *
 *   · focus alone is wrong on iOS, where the keyboard's own Done button
 *     dismisses it without blurring the field. The bar would stay hidden with
 *     no keyboard on screen and nothing to bring it back.
 *   · the gap is also honest about hardware keyboards, split keyboards and
 *     floating ones, none of which a focus event can distinguish.
 *
 * The threshold sits above the browser's own chrome and below any keyboard.
 * Hiding and showing the URL bar moves the visual viewport by roughly 50-90px;
 * the smallest keyboard is a good deal more than that.
 */
const KEYBOARD_MIN_PX = 120;

/** Anything that would summon a keyboard if it were focused. */
const isEditable = (el: Element | null): boolean => {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'file', 'color', 'image', 'hidden'].includes(el.type);
  }
  return el instanceof HTMLElement && el.isContentEditable;
};

export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    /* No visualViewport at all — an old browser. Fall back to focus, but only
       where a keyboard is plausible: on a device with a fine pointer, a
       focused text box means somebody clicked into it and there is no keyboard
       to get out of the way of. */
    if (!vv) {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      if (!coarse) return;
      const sync = () => setOpen(isEditable(document.activeElement));
      document.addEventListener('focusin', sync);
      document.addEventListener('focusout', sync);
      return () => {
        document.removeEventListener('focusin', sync);
        document.removeEventListener('focusout', sync);
      };
    }

    const measure = () => {
      /* clientHeight, not innerHeight: innerHeight follows the visual viewport
         on some builds, which would make this difference permanently zero. */
      const layout = document.documentElement.clientHeight;
      setOpen(layout - vv.height > KEYBOARD_MIN_PX);
    };

    measure();
    vv.addEventListener('resize', measure);
    // The visual viewport also moves without resizing — iOS scrolls it to keep
    // the focused field above the keyboard — and the gap changes when it does.
    vv.addEventListener('scroll', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      vv.removeEventListener('resize', measure);
      vv.removeEventListener('scroll', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return open;
}
