/* eslint-disable */
"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function Field({ count = 100 }) {
    const pointsRef = useRef<THREE.Points>(null!);

    // Create random positions for the nodes
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, [count]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Rotate the whole field slowly
        pointsRef.current.rotation.y = time * 0.05;
        pointsRef.current.rotation.x = time * 0.03;

        // Pulse effect
        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
    });

    return (
        <group>
            <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#8b5cf6"
                    size={0.08}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

// Connecting lines component
function Connections({ count = 40 }) {
    const linesRef = useRef<THREE.LineSegments>(null!);

    const lineGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 2 * 3); // 2 points per line, 3 coords each

        for (let i = 0; i < count; i++) {
            // Randomly connect points in space
            const x1 = (Math.random() - 0.5) * 10;
            const y1 = (Math.random() - 0.5) * 10;
            const z1 = (Math.random() - 0.5) * 10;

            const x2 = x1 + (Math.random() - 0.5) * 2;
            const y2 = y1 + (Math.random() - 0.5) * 2;
            const z2 = z1 + (Math.random() - 0.5) * 2;

            pos[i * 6] = x1;
            pos[i * 6 + 1] = y1;
            pos[i * 6 + 2] = z1;
            pos[i * 6 + 3] = x2;
            pos[i * 6 + 4] = y2;
            pos[i * 6 + 5] = z2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geometry;
    }, [count]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        linesRef.current.rotation.y = time * 0.05;
        linesRef.current.rotation.x = time * 0.03;

        // Animate opacity for a "data transmission" look
        const material = linesRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.1 + Math.sin(time * 1.5) * 0.05;
    });

    return (
        <lineSegments ref={linesRef} geometry={lineGeometry}>
            <lineBasicMaterial
                color="#a78bfa"
                transparent
                opacity={0.1}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </lineSegments>
    );
}

export default function ArchitectureField() {
    return (
        <div className="absolute inset-0 z-[-1] pointer-events-none opacity-60">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Field count={150} />
                <Connections count={60} />
            </Canvas>
        </div>
    );
}
