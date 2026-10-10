import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCardboardComputerModel } from "./createComputerModel.js";

export function ComputerModel() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(0, 0.05, 8.9);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xe8fff0, 0x17120e, 1.15);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2.5, 3.8, 5.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xb6ff3d, 1.1);
    rim.position.set(2.5, 1.2, -2.8);
    scene.add(rim);

    const screenFill = new THREE.PointLight(0xa9ff1c, 1.25, 6.5);
    screenFill.position.set(0, 0.3, 1.8);
    scene.add(screenFill);

    const model = createCardboardComputerModel();
    model.root.scale.setScalar(1);
    model.root.position.set(0, 0.05, 0);
    scene.add(model.root);

    const pointerTarget = new THREE.Vector2(0, 0);
    const currentTilt = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clickableMeshes = [];
    model.root.traverse((child) => {
      if (child.isMesh && child.userData.clickable) clickableMeshes.push(child);
    });

    let exploded = false;
    let explodeMix = 0;
    let raf = 0;
    let width = 1;
    let height = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 620 ? 10.8 : 8.9;
      camera.updateProjectionMatrix();
    };

    const updateRaycast = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(clickableMeshes, false)[0];
      mount.style.cursor = hit ? "pointer" : "default";
      return hit;
    };

    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      pointerTarget.set(x * 0.28, y * 0.18);
      updateRaycast(event);
    };

    const onPointerLeave = () => {
      pointerTarget.set(0, 0);
      mount.style.cursor = "default";
    };

    const onPointerDown = (event) => {
      if (!updateRaycast(event)) return;
      exploded = !exploded;
    };

    const animate = (time = 0) => {
      const seconds = time * 0.001;
      currentTilt.lerp(pointerTarget, 0.055);
      explodeMix = THREE.MathUtils.lerp(explodeMix, exploded ? 1 : 0, 0.075);

      model.parts.forEach((part) => {
        const home = part.userData.homePosition;
        const offset = part.userData.explodeOffset;
        part.position.set(
          home.x + offset.x * explodeMix,
          home.y + offset.y * explodeMix,
          home.z + offset.z * explodeMix,
        );
      });

      model.root.rotation.x = THREE.MathUtils.degToRad(-2) - currentTilt.y;
      model.root.rotation.y = THREE.MathUtils.degToRad(6) + currentTilt.x + (reducedMotion ? 0 : Math.sin(seconds * 0.55) * 0.035);
      model.root.rotation.z = Math.sin(seconds * 0.37) * 0.01;
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener("resize", resize);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);
    mount.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.style.cursor = "default";
      model.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="computer-model-canvas" aria-hidden="true" />;
}
