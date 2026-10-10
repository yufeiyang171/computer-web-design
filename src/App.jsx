import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const sceneBWords = [
  { src: "/assets/current-b-word-experience.png", className: "word word-experience", alt: "Experience" },
  { src: "/assets/current-b-word-behavior.png", className: "word word-behavior", alt: "Behavior" },
  { src: "/assets/current-b-word-story.png", className: "word word-story", alt: "Story" },
  { src: "/assets/current-b-word-interface.png", className: "word word-interface", alt: "Interface" },
  { src: "/assets/current-b-word-motion.png", className: "word word-motion", alt: "Motion" },
  { src: "/assets/current-b-word-emotion.png", className: "word word-emotion", alt: "Emotion" },
];

const getScrollDistance = () => Math.max(window.innerHeight * 6.6, 5200);
const reelCopyCount = 3;

const getReelLoopHeight = (reel) => {
  const firstItem = reel.querySelector('[data-reel-index="0"]');
  const nextCopyItem = reel.querySelector(`[data-reel-index="${projects.length}"]`);
  return Math.max(nextCopyItem && firstItem ? nextCopyItem.offsetTop - firstItem.offsetTop : reel.scrollHeight / reelCopyCount, 0);
};

const wrapReelScroll = (reel) => {
  const loopHeight = getReelLoopHeight(reel);
  if (loopHeight <= reel.clientHeight) return;

  while (reel.scrollTop >= loopHeight * 2) reel.scrollTop -= loopHeight;
  while (reel.scrollTop < loopHeight) reel.scrollTop += loopHeight;
};

const projects = [
  {
    id: "puploop-home",
    image: "/assets/scene3-project-home.png",
    label: "PUPLOOP Home",
    meta: "Scene / Portfolio",
    cardTitle: "PUPLOOP APP DESIGN",
    cardType: "INTERACTION DESIGN",
    focus: "50% 50%",
  },
  {
    id: "arcade-cabinet",
    image: "/assets/scene3-project-arcade.png",
    label: "Arcade Cabinet",
    meta: "Visual / Motion",
    cardTitle: "ARCADE PORTFOLIO",
    cardType: "VISUAL DESIGN",
    focus: "50% 50%",
  },
  {
    id: "look-this",
    image: "/assets/scene3-project-arcade-gray.png",
    label: "Look This",
    meta: "Game / Interface",
    cardTitle: "LOOK THIS SYSTEM",
    cardType: "PRODUCT DESIGN",
    focus: "50% 50%",
  },
  {
    id: "open-it",
    image: "/assets/scene3-project-open.png",
    label: "Open It",
    meta: "Play / Behavior",
    cardTitle: "OPEN IT EXPERIENCE",
    cardType: "PLAY DESIGN",
    focus: "50% 50%",
  },
  {
    id: "welcome-card",
    image: "/assets/scene3-project-welcome.png",
    label: "Welcome Card",
    meta: "Identity / Story",
    cardTitle: "WELCOME INTERFACE",
    cardType: "BRAND DESIGN",
    focus: "50% 50%",
  },
  {
    id: "pixel-loop",
    image: "/assets/scene3-project-pixel-loop-new.png",
    label: "Pixel Loop",
    meta: "Brand / Interaction",
    cardTitle: "PIXEL LOOP",
    cardType: "INTERACTION DESIGN",
    focus: "50% 50%",
  },
  {
    id: "hike-more",
    image: "/assets/scene3-project-hike.png",
    label: "Hike More",
    meta: "Travel / System",
    cardTitle: "HIKE MORE TRAVEL",
    cardType: "SERVICE DESIGN",
    focus: "50% 50%",
  },
];

export function App() {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const sceneRef = useRef(null);
  const reelRef = useRef(null);
  const reelAnimationRef = useRef(null);
  const reelLastFrameRef = useRef(0);
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const wheelResumeTimerRef = useRef(null);
  const projectTransitionTimerRef = useRef(null);
  const hoveredProjectIdRef = useRef(null);
  const activeProjectIdRef = useRef(null);
  const isReelPausedRef = useRef(false);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [transitionProjectId, setTransitionProjectId] = useState(null);
  const [isReelPaused, setIsReelPaused] = useState(false);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const transitionProject = projects.find((project) => project.id === transitionProjectId) ?? null;

  useEffect(() => {
    hoveredProjectIdRef.current = hoveredProjectId;
  }, [hoveredProjectId]);

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  useEffect(() => {
    isReelPausedRef.current = isReelPaused;
  }, [isReelPaused]);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const params = new URLSearchParams(window.location.search);
    const layout = params.get("layout");
    const previewProgress = layout === "3" ? 0.92 : layout === "2" ? 0.64 : 0;

    const frame = requestAnimationFrame(() => {
      const targetTop = (trackRef.current?.offsetTop ?? 0) + getScrollDistance() * previewProgress;
      window.scrollTo(0, targetTop);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    projects.forEach(({ image: src }) => {
      const image = new Image();
      image.src = src;
    });

    return () => {
      window.clearTimeout(hoverTimerRef.current);
      window.clearTimeout(leaveTimerRef.current);
      window.clearTimeout(wheelResumeTimerRef.current);
      window.clearTimeout(projectTransitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    gsap.to(".camera-push", {
      scale: activeProjectId ? 1.055 : 1,
      duration: 0.55,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [activeProjectId]);

  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return undefined;

    const handleNativeWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const scaledDelta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;

      window.clearTimeout(wheelResumeTimerRef.current);
      const loopHeight = getReelLoopHeight(reel);
      if (loopHeight > reel.clientHeight) {
        let nextScrollTop = reel.scrollTop + scaledDelta;
        while (nextScrollTop < loopHeight) nextScrollTop += loopHeight;
        while (nextScrollTop >= loopHeight * 2) nextScrollTop -= loopHeight;
        reel.scrollTop = nextScrollTop;
      } else {
        reel.scrollTop += scaledDelta;
      }
      setIsReelPaused(true);

      wheelResumeTimerRef.current = window.setTimeout(() => {
        if (!hoveredProjectIdRef.current && !activeProjectIdRef.current) setIsReelPaused(false);
      }, 650);
    };

    reel.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => reel.removeEventListener("wheel", handleNativeWheel);
  }, []);

  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return undefined;

    const placeAtMiddleCopy = () => {
      const loopHeight = getReelLoopHeight(reel);
      if (loopHeight > reel.clientHeight) reel.scrollTop = loopHeight;
    };

    const tick = (time) => {
      const lastTime = reelLastFrameRef.current || time;
      const delta = Math.min(time - lastTime, 48);
      reelLastFrameRef.current = time;

      if (!isReelPausedRef.current && !hoveredProjectIdRef.current && !activeProjectIdRef.current) {
        reel.scrollTop += delta * 0.035;
        wrapReelScroll(reel);
      }

      reelAnimationRef.current = window.requestAnimationFrame(tick);
    };

    const startFrame = window.requestAnimationFrame(() => {
      placeAtMiddleCopy();
      reelAnimationRef.current = window.requestAnimationFrame(tick);
    });

    const handleResize = () => placeAtMiddleCopy();
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(startFrame);
      window.cancelAnimationFrame(reelAnimationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.set(".room-shot, .camera-push, .scene-a, .scene-b, .scene-3, .scroll-cue", {
        force3D: true,
        transformOrigin: "50% 50%",
      });
      gsap.set(".camera-push", {
        scale: 1,
        transformOrigin: "67% 54%",
      });
      gsap.set(".camera", {
        scale: 1,
        x: 0,
        y: 0,
        force3D: true,
        transformOrigin: "50.2% 60.8%",
      });
      gsap.set(".room-shot-a", { autoAlpha: 1 });
      gsap.set(".scene-b, .scene-b .word, .scene-b-title, .scene-b-support", { autoAlpha: 0 });
      gsap.set(".scene-b", { y: 24 });
      gsap.set(".scene-b .word", { y: 22 });
      gsap.set(".scene-b-title", { y: 30, scale: 0.94 });
      gsap.set(".scene-b-support", { y: 16 });
      gsap.set(".scene-3, .scene3-reel", { autoAlpha: 0 });
      gsap.set(".scene3-reel", { xPercent: -118 });

      if (reducedMotion) {
        gsap.set(".camera", { scale: 2.22, x: () => Math.min(window.innerWidth * 0.23, 390), y: 0 });
        gsap.set(".scene-a", { autoAlpha: 0 });
        gsap.set(".scene-b, .scene-b .word, .scene-b-title, .scene-b-support", {
          autoAlpha: 0,
        });
        gsap.set(".scene-3, .scene3-reel", {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
        });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          pin: sceneRef.current,
          scrub: 1.25,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.addLabel("establish", 0)
        .to(".camera", { scale: 1.035, duration: 2.2 }, "establish")
        .to(".scene-a-intro", { autoAlpha: 0, x: -22, y: -18, duration: 1.7 }, 0.65)
        .to(".scene-a-portfolio", { autoAlpha: 0, x: 28, y: 20, duration: 1.65 }, 0.9)
        .to(".scene-a-support", { autoAlpha: 0, y: 16, duration: 1.3 }, 0.52)
        .to(".scroll-cue", { autoAlpha: 0.28, y: 12, duration: 1.3 }, 0.7)
        .addLabel("push", 2.0)
        .to(".camera", { scale: 2.22, xPercent: 0, yPercent: 0, duration: 5.8 }, "push")
        .addLabel("buildSceneB", 6.85)
        .to(".scene-b", { autoAlpha: 1, y: 0, duration: 0.75 }, "buildSceneB")
        .to(".scene-b-title", { autoAlpha: 1, y: 0, scale: 1, duration: 0.95 }, "buildSceneB+=0.25")
        .to(
          ".scene-b .word",
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.78,
            stagger: {
              each: 0.1,
              from: "start",
            },
          },
          "buildSceneB+=0.76",
        )
        .to(".scene-b-support", { autoAlpha: 0.84, y: 0, duration: 0.7 }, "buildSceneB+=1.24")
        .to(".scroll-cue", { autoAlpha: 1, y: 0, duration: 0.78 }, "buildSceneB+=1.34")
        .to({}, { duration: 1.55 })
        .addLabel("panScene3")
        .to(".scene-b-title", { autoAlpha: 0, y: -18, duration: 1.05 }, "panScene3")
        .to(".scene-b .word", { autoAlpha: 0, y: -12, duration: 0.85, stagger: 0.04 }, "panScene3+=0.04")
        .to(".scene-b-support", { autoAlpha: 0, y: 14, duration: 0.75 }, "panScene3+=0.2")
        .to(".camera", { x: () => Math.min(window.innerWidth * 0.23, 390), scale: 2.26, duration: 4.2 }, "panScene3")
        .to(".scene-3", { autoAlpha: 1, duration: 0.7 }, "panScene3+=0.45")
        .to(".scene3-reel", { autoAlpha: 1, xPercent: 0, duration: 2.75 }, "panScene3+=0.65")
        .to(".scroll-cue", { autoAlpha: 0, y: 20, duration: 0.65 }, "panScene3+=0.42")
        .to({}, { duration: 1.85 });

      const refresh = () => ScrollTrigger.refresh();
      const images = rootRef.current.querySelectorAll("img");
      images.forEach((image) => {
        if (!image.complete) image.addEventListener("load", refresh, { once: true });
      });

      return () => {
        images.forEach((image) => image.removeEventListener("load", refresh));
      };
    },
    { scope: rootRef },
  );

  const jumpToMidShot = () => {
    const start = trackRef.current?.offsetTop ?? 0;
    const distance = getScrollDistance();
    window.scrollTo({ top: start + distance * 0.88, behavior: "smooth" });
  };

  const activateProject = (projectId) => {
    setActiveProjectId(projectId);
  };

  const handleProjectEnter = (projectId) => {
    window.clearTimeout(hoverTimerRef.current);
    window.clearTimeout(leaveTimerRef.current);
    setIsReelPaused(true);
    hoverTimerRef.current = window.setTimeout(() => setHoveredProjectId(projectId), 60);
  };

  const handleProjectLeave = () => {
    window.clearTimeout(hoverTimerRef.current);
    window.clearTimeout(leaveTimerRef.current);
    setHoveredProjectId(null);
    leaveTimerRef.current = window.setTimeout(() => {
      if (!activeProjectId) setIsReelPaused(false);
    }, 220);
  };

  const handleProjectClick = (projectId) => {
    window.clearTimeout(hoverTimerRef.current);
    window.clearTimeout(leaveTimerRef.current);
    window.clearTimeout(projectTransitionTimerRef.current);
    setIsReelPaused(true);
    activateProject(projectId);
    setTransitionProjectId(null);

    projectTransitionTimerRef.current = window.setTimeout(() => {
      setTransitionProjectId(projectId);
    }, 1350);
  };

  const reelItems = Array.from({ length: reelCopyCount }, () => projects).flat();

  return (
    <main ref={rootRef} className={`page ${activeProjectId ? "has-project-selection" : ""}`}>
      <nav className="fixed-nav" aria-label="Primary navigation">
        <a className="brand-mark" href="#top" aria-label="PUPLOOP home">
          <img src="/assets/current-a-nav-brand.png" alt="Hello, I'm Puploop" />
        </a>
        <div className="nav-menu" aria-label="Primary sections">
          <img src="/assets/current-nav-items.png" alt="ABOUT WORK PROCESS CONTACT" />
          <a className="nav-hit nav-hit-about" href="#top" aria-label="About" />
          <a className="nav-hit nav-hit-work" href="#top" aria-label="Work" />
          <a className="nav-hit nav-hit-process" href="#top" aria-label="Process" />
          <a className="nav-hit nav-hit-contact" href="#top" aria-label="Contact" />
        </div>
      </nav>

      <section id="top" ref={trackRef} className="hero-track" aria-label="PUPLOOP portfolio opening scene">
        <div ref={sceneRef} className="hero-scene">
            <div className="stage-frame">
              <div className="camera">
              <div className="camera-push">
                <img className="room-shot room-shot-a" src="/assets/current-scene-a-composed.png" alt="" aria-hidden="true" />
                <div className={`project-tv-preview ${activeProject ? "is-visible" : ""}`} aria-hidden="true">
                  <div className="project-tv-screen">
                    {activeProject && <img src={activeProject.image} alt="" style={{ objectPosition: activeProject.focus }} />}
                  </div>
                  <img className="project-tv-frame" src="/assets/scene3-tv-empty-frame.png" alt="" />
                </div>
              </div>
            </div>

            <button className="computer-hotspot" type="button" onClick={jumpToMidShot} aria-label="Start exploring PUPLOOP portfolio" />

            <img className="scene-a scene-a-intro" src="/assets/current-a-intro-copy.png" alt="" aria-hidden="true" />
            <img className="scene-a scene-a-portfolio" src="/assets/current-a-portfolio.png" alt="" aria-hidden="true" />
            <img className="scene-a scene-a-support" src="/assets/current-a-support.png" alt="" aria-hidden="true" />

            <div className="scene-b" aria-hidden="true">
              <img className="scene-b-title" src="/assets/current-b-title.png" alt="" />
              {sceneBWords.map((word) => (
                <img key={word.alt} className={word.className} src={word.src} alt="" />
              ))}
              <img className="scene-b-support" src="/assets/current-b-support.png" alt="" />
            </div>

            <div className={`scene-3 ${isReelPaused ? "is-paused" : ""} ${activeProject ? "is-selected" : ""}`} aria-label="PUPLOOP project reel">
              <div ref={reelRef} className="scene3-reel" onPointerLeave={handleProjectLeave} onMouseLeave={handleProjectLeave}>
                <div className="reel-scroll">
                  <div className="reel-wheel">
                    <div className="reel-track">
                      {reelItems.map((project, index) => {
                        const active = activeProjectId === project.id;
                        const hovered = hoveredProjectId === project.id;

                        return (
                          <button
                            key={`${project.id}-${index}`}
                            className={`project-card ${hovered ? "is-hovered" : ""} ${active ? "is-active" : ""}`}
                            type="button"
                            data-project-id={project.id}
                            data-reel-index={index}
                            onPointerEnter={() => handleProjectEnter(project.id)}
                            onMouseEnter={() => handleProjectEnter(project.id)}
                            onFocus={() => handleProjectEnter(project.id)}
                            onBlur={handleProjectLeave}
                            onClick={() => handleProjectClick(project.id)}
                            aria-label={`${project.label} ${project.meta}`}
                          >
                            <img src={project.image} alt="" style={{ objectPosition: project.focus }} />
                            <span className="project-card-meta" aria-hidden="true">
                              <strong>{project.cardTitle}</strong>
                              <small>{project.cardType}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`scene3-detail ${activeProject ? "is-visible" : ""}`} aria-live="polite">
                {activeProject && (
                  <div className="scene3-copy">
                    <strong>{activeProject.cardTitle}</strong>
                    <span>{activeProject.cardType}</span>
                    <p>An interaction design studio creating playful experiences through technology, motion, and storytelling.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="scroll-cue" aria-hidden="true">
              <img src="/assets/current-b-scroll-cue.png" alt="" />
            </div>

            <div className="film-noise" aria-hidden="true" />
            <div className="vignette" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="anchor-spacer" aria-hidden="true" />

      <div className={`project-transition ${transitionProject ? "is-visible" : ""}`} aria-hidden={!transitionProject}>
        {transitionProject && (
          <img src={transitionProject.image} alt="" />
        )}
      </div>
    </main>
  );
}
