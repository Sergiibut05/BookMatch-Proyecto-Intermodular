import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { LandingSceneRefs } from './landing-scene';

gsap.registerPlugin(ScrollTrigger);

export function setupLandingScroll(
  refs: LandingSceneRefs,
  scrollContainer: HTMLElement,
  isMobile: boolean,
): () => void {
  const { bookGroup, altarGroup, spotLight, rimLight, camera, renderer } = refs;
  const lat = isMobile ? 0 : 1;

  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      invalidateOnRefresh: true,
    },
  });

  // ── Section 1 → 2 : Hero to AI recommendations ──
  masterTl.to(
    bookGroup.position,
    { x: -1.2 * lat, y: 0.6, z: 0, duration: 1, ease: 'power3.inOut' },
    0,
  );
  masterTl.to(
    bookGroup.rotation,
    { y: -1.0, z: -0.12, duration: 1, ease: 'power3.inOut' },
    0,
  );

  // ── Section 2 → 3 : 360 spin + side swap ──
  masterTl.to(
    bookGroup.position,
    { x: 1.3 * lat, y: 0.3, duration: 1, ease: 'power3.inOut' },
    1,
  );
  masterTl.to(
    bookGroup.rotation,
    { y: Math.PI * 2 - 1.0, x: -0.1, z: 0, duration: 1, ease: 'power3.inOut' },
    1,
  );
  masterTl.to(
    camera.position,
    { x: 0.4 * lat, duration: 1, ease: 'power3.inOut' },
    1,
  );

  // ── Section 3 → 4 : pitch up + scale ──
  masterTl.to(
    bookGroup.position,
    { x: 0, y: 1.2, duration: 1, ease: 'power3.inOut' },
    2,
  );
  masterTl.to(
    bookGroup.rotation,
    { x: 0.4, y: Math.PI * 2 - 0.5, z: 0, duration: 1, ease: 'power3.inOut' },
    2,
  );
  masterTl.to(
    bookGroup.scale,
    { x: 1.15, y: 1.15, z: 1.15, duration: 1, ease: 'power3.inOut' },
    2,
  );
  masterTl.to(
    camera.position,
    { x: 0, duration: 1, ease: 'power3.inOut' },
    2,
  );
  masterTl.to(
    spotLight,
    { intensity: 2.5, duration: 1 },
    2,
  );
  masterTl.to(
    rimLight,
    { intensity: 1.0, duration: 1 },
    2,
  );

  // ── Section 4 → 5 : landing on altar ──
  masterTl.to(
    bookGroup.position,
    { x: 0, y: -0.55, z: 0, duration: 1, ease: 'power4.out' },
    3,
  );
  masterTl.to(
    bookGroup.rotation,
    { x: 0, y: Math.PI * 2 - 0.25, z: 0, duration: 1, ease: 'power4.out' },
    3,
  );
  masterTl.to(
    bookGroup.scale,
    { x: 0.9, y: 0.9, z: 0.9, duration: 1, ease: 'power4.out' },
    3,
  );
  masterTl.to(
    spotLight,
    { intensity: 4.5, duration: 1 },
    3,
  );
  masterTl.to(
    renderer,
    { toneMappingExposure: 1.15, duration: 1 },
    3,
  );

  // ── Altar entrance (starts slightly ahead of section 5) ──
  gsap.to(altarGroup.position, {
    y: -1.6,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: scrollContainer,
      start: '70% top',
      end: '90% top',
      scrub: 1,
    },
  });

  gsap.to(altarGroup.scale, {
    y: 1,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: scrollContainer,
      start: '68% top',
      end: '88% top',
      scrub: 1,
      onEnter: () => { altarGroup.visible = true; },
    },
  });

  // ── Text section animations ──
  const sections = scrollContainer.querySelectorAll<HTMLElement>('[data-section]');
  sections.forEach((section) => {
    const textElements = section.querySelectorAll<HTMLElement>('.landing-text');
    if (textElements.length === 0) return;

    gsap.from(Array.from(textElements), {
      y: 60,
      opacity: 0,
      stagger: 0.12,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        end: 'top 30%',
        scrub: 0.6,
      },
    });
  });

  // ── Hero scroll indicator fade-out ──
  const scrollHint = scrollContainer.querySelector<HTMLElement>('.scroll-hint');
  if (scrollHint) {
    gsap.to(scrollHint, {
      opacity: 0,
      y: -20,
      scrollTrigger: {
        trigger: scrollContainer,
        start: 'top top',
        end: '5% top',
        scrub: true,
      },
    });
  }

  // ── CTA section entrance ──
  const ctaSection = scrollContainer.querySelector<HTMLElement>('[data-section="cta"]');
  if (ctaSection) {
    const ctaElements = ctaSection.querySelectorAll<HTMLElement>('.cta-element');
    gsap.from(Array.from(ctaElements), {
      y: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ctaSection,
        start: 'top 60%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  return () => {
    masterTl.kill();
    ScrollTrigger.getAll().forEach(st => st.kill());
  };
}
