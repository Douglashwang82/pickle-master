"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { setConsoleFunction } from "three";

// Suppress THREE.Clock deprecation warning emitted by R3F internals.
// R3F v9 still uses new THREE.Clock(); THREE r183 deprecated it.
// Remove once R3F ships Timer support.
setConsoleFunction((type: string, message: string, ...rest: unknown[]) => {
  if (type === "warn" && message.includes("Clock: This module has been deprecated")) return;
  (console as Record<string, (...a: unknown[]) => void>)[type]?.(message, ...rest);
});

const COURT = {
  width: 5,
  length: 11,
  lineWidth: 0.12,
  kitchenDepth: 1.75,
  serviceDepth: 3.75,
  netHeightCenter: 0.86,
  netHeightPost: 0.92,
  postOffset: 2.8,
} as const;

type HoleRow = { vFrac: number; count: number; phase: number };

const HOLE_ROWS: HoleRow[] = [
  { vFrac: 0.13, count: 3, phase: 0.17 },
  { vFrac: 0.22, count: 5, phase: 0.0 },
  { vFrac: 0.31, count: 6, phase: 0.08 },
  { vFrac: 0.41, count: 7, phase: 0.0 },
  { vFrac: 0.5, count: 7, phase: 0.07 },
  { vFrac: 0.59, count: 7, phase: 0.0 },
  { vFrac: 0.69, count: 6, phase: 0.08 },
  { vFrac: 0.78, count: 5, phase: 0.0 },
  { vFrac: 0.87, count: 3, phase: 0.17 },
];

function drawHoles(
  ctx: CanvasRenderingContext2D,
  size: number,
  holeRadius: number,
  mode: "color" | "bump",
) {
  HOLE_ROWS.forEach(({ vFrac, count, phase }) => {
    const y = vFrac * size;

    for (let index = 0; index < count; index += 1) {
      const u = (index / count + phase) % 1;
      const x = u * size;

      // Repeat each hole across the UV seam so the texture wraps cleanly.
      for (const px of [x, x - size, x + size]) {
        if (mode === "color") {
          const gradient = ctx.createRadialGradient(px, y, 0, px, y, holeRadius);
          gradient.addColorStop(0, "rgba(16, 24, 0, 0.97)");
          gradient.addColorStop(0.55, "rgba(32, 46, 2, 0.80)");
          gradient.addColorStop(0.85, "rgba(70, 95, 8, 0.35)");
          gradient.addColorStop(1, "rgba(100, 130, 12, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, y, holeRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const rim = ctx.createRadialGradient(
            px,
            y,
            holeRadius * 0.6,
            px,
            y,
            holeRadius * 1.35,
          );
          rim.addColorStop(0, "rgba(255,255,255,0)");
          rim.addColorStop(0.4, "rgba(255,255,255,0.55)");
          rim.addColorStop(1, "rgba(255,255,255,0)");

          ctx.fillStyle = rim;
          ctx.beginPath();
          ctx.arc(px, y, holeRadius * 1.35, 0, Math.PI * 2);
          ctx.fill();

          const hole = ctx.createRadialGradient(px, y, 0, px, y, holeRadius);
          hole.addColorStop(0, "#000000");
          hole.addColorStop(0.75, "#0a0a0a");
          hole.addColorStop(1, "#ffffff");

          ctx.fillStyle = hole;
          ctx.beginPath();
          ctx.arc(px, y, holeRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });
}

function buildColorMap(size = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create pickleball texture context.");
  }

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#e8f85e");
  base.addColorStop(0.45, "#d7ef4c");
  base.addColorStop(1, "#bfd930");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  drawHoles(ctx, size, Math.round(size * 0.023), "color");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildBumpMap(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create pickleball bump-map context.");
  }

  ctx.fillStyle = "#d0d0d0";
  ctx.fillRect(0, 0, size, size);
  drawHoles(ctx, size, Math.round(size * 0.024), "bump");

  return new THREE.CanvasTexture(canvas);
}

function buildGradientMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 3;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create gradient map context.");
  }

  // 3-step cel-shading: shadow | midtone | highlight
  ctx.fillStyle = "#404040";
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = "#888888";
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(2, 0, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

function buildNetTexture() {
  const W = 512;
  const H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create net texture context.");
  }

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 4;

  // Horizontal lines (4 rows)
  const hStep = H / 4;
  for (let y = 0; y <= H; y += hStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Vertical lines (34 columns)
  const vStep = W / 34;
  for (let x = 0; x <= W; x += vStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function CourtLines() {
  const gradientMap = useMemo(() => buildGradientMap(), []);
  const lineMaterial = (
    <meshToonMaterial color="#ffffff" gradientMap={gradientMap} />
  );
  const halfLength = COURT.length / 2;
  const serviceLineZ = halfLength - COURT.serviceDepth;
  const kitchenLineZ = COURT.kitchenDepth;
  const centerServiceLineLength = COURT.serviceDepth - COURT.kitchenDepth;

  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0, halfLength]}>
        <boxGeometry args={[COURT.width + COURT.lineWidth, 0.04, COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, -halfLength]}>
        <boxGeometry args={[COURT.width + COURT.lineWidth, 0.04, COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[-COURT.width / 2, 0, 0]}>
        <boxGeometry args={[COURT.lineWidth, 0.04, COURT.length + COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[COURT.width / 2, 0, 0]}>
        <boxGeometry args={[COURT.lineWidth, 0.04, COURT.length + COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, kitchenLineZ]}>
        <boxGeometry args={[COURT.width + COURT.lineWidth, 0.04, COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, -kitchenLineZ]}>
        <boxGeometry args={[COURT.width + COURT.lineWidth, 0.04, COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, serviceLineZ]}>
        <boxGeometry args={[COURT.width + COURT.lineWidth, 0.04, COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, -serviceLineZ]}>
        <boxGeometry args={[COURT.width + COURT.lineWidth, 0.04, COURT.lineWidth]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, (serviceLineZ + kitchenLineZ) / 2]}>
        <boxGeometry args={[COURT.lineWidth, 0.04, centerServiceLineLength]} />
        {lineMaterial}
      </mesh>
      <mesh position={[0, 0, -(serviceLineZ + kitchenLineZ) / 2]}>
        <boxGeometry args={[COURT.lineWidth, 0.04, centerServiceLineLength]} />
        {lineMaterial}
      </mesh>
    </group>
  );
}

function Court() {
  const gradientMap = useMemo(() => buildGradientMap(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[COURT.width, COURT.length]} />
        <meshToonMaterial color="#2196b0" gradientMap={gradientMap} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[COURT.width, COURT.kitchenDepth * 2]} />
        <meshToonMaterial color="#1a82a0" gradientMap={gradientMap} />
      </mesh>

      <CourtLines />
    </group>
  );
}

function Net() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const netTexture = useMemo(() => buildNetTexture(), []);
  const gradientMap = useMemo(() => buildGradientMap(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) {
      return;
    }

    timeRef.current += delta;
    const time = timeRef.current;
    meshRef.current.position.y = COURT.netHeightCenter / 2 + Math.sin(time * 1.1) * 0.01;
    groupRef.current.rotation.z = Math.sin(time * 0.55) * 0.008;
  });

  return (
    <group ref={groupRef} frustumCulled={false}>
      {/* Top bar — thick white band */}
      <mesh position={[0, COURT.netHeightCenter + 0.04, 0]} castShadow>
        <boxGeometry args={[COURT.width + 0.6, 0.08, 0.07]} />
        <meshToonMaterial color="#ffffff" gradientMap={gradientMap} />
      </mesh>

      {/* Bottom band */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[COURT.width + 0.55, 0.07, 0.06]} />
        <meshToonMaterial color="#dde8f8" gradientMap={gradientMap} />
      </mesh>

      {/* Net mesh with canvas-grid texture */}
      <mesh ref={meshRef} position={[0, COURT.netHeightCenter / 2, 0]}>
        <planeGeometry args={[COURT.width + 0.4, COURT.netHeightCenter]} />
        <meshBasicMaterial
          map={netTexture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Posts */}
      <mesh position={[-COURT.postOffset, COURT.netHeightPost / 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, COURT.netHeightPost, 16]} />
        <meshToonMaterial color="#e0ecff" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[COURT.postOffset, COURT.netHeightPost / 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, COURT.netHeightPost, 16]} />
        <meshToonMaterial color="#e0ecff" gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

function BallShadow({ ballRef }: { ballRef: RefObject<THREE.Mesh | null> }) {
  const shadowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ballRef.current || !shadowRef.current) {
      return;
    }

    const { x, y, z } = ballRef.current.position;
    shadowRef.current.position.set(x, 0.025, z);

    const squash = THREE.MathUtils.clamp(1.2 - y * 0.32, 0.58, 1.08);
    shadowRef.current.scale.setScalar(squash);

    const material = shadowRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = THREE.MathUtils.clamp(0.34 - y * 0.05, 0.12, 0.32);
  });

  return (
    <mesh
      ref={shadowRef}
      frustumCulled={false}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.025, 0]}
    >
      <circleGeometry args={[0.38, 32]} />
      <meshBasicMaterial color="#07141a" transparent opacity={0.26} />
    </mesh>
  );
}

function Pickleball() {
  const meshRef = useRef<THREE.Mesh>(null);
  const colorMap = useMemo(() => buildColorMap(1024), []);
  const bumpMap = useMemo(() => buildBumpMap(512), []);
  const gradientMap = useMemo(() => buildGradientMap(), []);

  useEffect(() => {
    return () => {
      colorMap.dispose();
      bumpMap.dispose();
      gradientMap.dispose();
    };
  }, [bumpMap, colorMap, gradientMap]);

  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    timeRef.current += delta;
    const time = timeRef.current;
    const bounce = Math.abs(Math.sin(time * 1.85)) ** 1.2;
    const travelZ = Math.sin(time * 0.95) * 3.65;
    const driftX = Math.cos(time * 1.35) * 1.15;

    meshRef.current.position.set(driftX, 0.35 + bounce * 1.65, travelZ);
    meshRef.current.rotation.x += 0.06;
    meshRef.current.rotation.y += 0.1;
    meshRef.current.rotation.z += 0.035;
  });

  return (
    <>
      <mesh ref={meshRef} castShadow frustumCulled={false}>
        <sphereGeometry args={[0.28, 64, 64]} />
        <meshToonMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.04}
          gradientMap={gradientMap}
        />
      </mesh>
      <BallShadow ballRef={meshRef} />
    </>
  );
}

function SceneRig() {
  const rigRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!rigRef.current) {
      return;
    }

    timeRef.current += delta;
    const time = timeRef.current;
    rigRef.current.rotation.y = -0.34 + Math.sin(time * 0.16) * 0.02;
    rigRef.current.rotation.x = 0.08 + Math.cos(time * 0.2) * 0.01;
    rigRef.current.position.set(0, -1.05 + Math.sin(time * 0.35) * 0.025, 0);
  });

  return (
    <group
      ref={rigRef}
      position={[0, -1.05, 0]}
      rotation={[0.08, -0.34, 0]}
      frustumCulled={false}
    >
      <Court />
      <Net />
      <Pickleball />
    </group>
  );
}

export default function PickleballScene() {
  return (
    <Canvas
      camera={{ position: [5.4, 4.8, 8.6], fov: 33 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      frameloop="always"
      shadows={{ type: THREE.PCFShadowMap }}
    >
      <fog attach="fog" args={["#061118", 16, 32]} />

      <ambientLight intensity={1.5} color="#e8f3ff" />
      <hemisphereLight intensity={1.1} color="#dff6ff" groundColor="#0b2531" />
      <spotLight
        position={[5, 9, 6]}
        angle={0.45}
        penumbra={0.3}
        intensity={60}
        color="#fff4cf"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-6, 5, -4]}
        intensity={1.6}
        color="#8fdcff"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#0b1820" roughness={1} />
      </mesh>

      <SceneRig />
      <Environment preset="city" />
    </Canvas>
  );
}
