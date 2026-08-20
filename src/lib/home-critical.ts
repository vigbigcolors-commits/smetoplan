/** Above-fold paint without waiting on ~95KB Tailwind. */
export const CRITICAL_HOME_CSS = `
html{background:#0E1624}
body{margin:0;background:#fff;color:#0e1624}
.sp-header{box-sizing:border-box;height:4.25rem;border-bottom:1px solid rgba(255,255,255,.1);background:#0B132B}
.sp-hero{position:relative;isolation:isolate;min-height:34rem;overflow:hidden;background:#E8EEF4}
.sp-hero-media{position:absolute;inset:0}
.sp-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%}
`.replace(/\s+/g, ' ').trim();

/** Same candidates as HomeHero <picture> — browser picks by DPR×viewport. */
export const HERO_SRCSET =
  '/Images/smetoplan-hero-hologram-640.webp 640w, /Images/smetoplan-hero-hologram-1080.webp 1080w, /Images/smetoplan-hero-hologram-1600.webp 1600w';

export const HERO_SIZES = '100vw';

export const HERO_SRC = '/Images/smetoplan-hero-hologram-1080.webp';
