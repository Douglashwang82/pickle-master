"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

// Hole layout: { vFrac = UV vertical position, count = holes per row, phase = horizontal offset }
const HOLE_ROWS: { vFrac: number; count: number; phase: number }[] = [
  { vFrac: 0.13, count: 3, phase: 0.17 },
  { vFrac: 0.22, count: 5, phase: 0.0  },
  { vFrac: 0.31, count: 6, phase: 0.08 },
  { vFrac: 0.41, count: 7, phase: 0.0  },
  { vFrac: 0.50, count: 7, phase: 0.07 },
  { vFrac: 0.59, count: 7, phase: 0.0  },
  { vFrac: 0.69, count: 6, phase: 0.08 },
  { vFrac: 0.78, count: 5, phase: 0.0  },
  { vFrac: 0.87, count: 3, phase: 0.17 },
];

function drawHoles(
  ctx: CanvasRenderingContext2D,
  size: number,
  holeR: number,
  mode: "color" | "bump",
) {
  HOLE_ROWS.forEach(({ vFrac, count, phase }) => {
    const y = vFrac * size;
    for (let i = 0; i < count; i++) {
      const u = (i / count + phase) % 1;
      const x = u * size;
      // Draw at x and ±size to seamlessly handle the UV horizontal wrap
      for (const px of [x, x - size, x + size]) {
        if (mode === "color") {
          // Radial gradient: dark centre → feather to base colour
          const g = ctx.createRadialGradient(px, y, 0, px, y, holeR);
          g.addColorStop(0,    "rgba(16, 24, 0, 0.97)");
          g.addColorStop(0.55, "rgba(32, 46, 2, 0.80)");
          g.addColorStop(0.85, "rgba(70, 95, 8, 0.35)");
          g.addColorStop(1,    "rgba(100, 130, 12, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, y, holeR, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bump: raised rim (light ring) then deep hole (black)
          const rim = ctx.createRadialGradient(px, y, holeR * 0.6, px, y, holeR * 1.35);
          rim.addColorStop(0,   "rgba(255,255,255,0)");
          rim.addColorStop(0.4, "rgba(255,255,255,0.55)");
          rim.addColorStop(1,   "rgba(255,255,255,0)");
          ctx.fillStyle = rim;
          ctx.beginPath();
          ctx.arc(px, y, holeR * 1.35, 0, Math.PI * 2);
          ctx.fill();

          const hole = ctx.createRadialGradient(px, y, 0, px, y, holeR);
          hole.addColorStop(0,   "#000000");
          hole.addColorStop(0.75, "#0a0a0a");
          hole.addColorStop(1,   "#ffffff");
          ctx.fillStyle = hole;
          ctx.beginPath();
          ctx.arc(px, y, holeR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });
}

function buildColorMap(size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Pickleball yellow-green base with subtle surface gradient
  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0,   "#D8EC3E");
  base.addColorStop(0.5, "#CEEA3A");
  base.addColorStop(1,   "#C4E032");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  drawHoles(ctx, size, Math.round(size * 0.023), "color");

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildBumpMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#d0d0d0"; // mid-grey baseline (slight overall surface texture)
  ctx.fillRect(0, 0, size, size);

  drawHoles(ctx, size, Math.round(size * 0.024), "bump");

  return new THREE.CanvasTexture(canvas);
}

function Ball() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const colorMap = useMemo(() => buildColorMap(1024), []);
  const bumpMap  = useMemo(() => buildBumpMap(512), []);

  useFrame((_, dt) => {
    meshRef.current.rotation.y += dt * 0.20;
    meshRef.current.rotation.x += dt * 0.07;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.07}
        roughness={0.58}
        metalness={0.04}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

export default function PickleballScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
    >
      {/* Warm key light from top-right; cool fill from back-left */}
      <ambientLight intensity={0.30} />
      <directionalLight position={[4, 6, 4]}   intensity={1.5} color="#fff6d8" />
      <directionalLight position={[-4, -2, -3]} intensity={0.28} color="#c0d8ff" />

      {/* HDR environment for realistic reflections — background stays transparent */}
      <Environment preset="studio" />

      <Ball />
    </Canvas>
  );
}
