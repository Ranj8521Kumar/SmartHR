import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function AnimatedShapes() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Animated Torus */}
      <mesh position={[-3, 2, 0]} castShadow receiveShadow>
        <torusGeometry args={[1, 0.4, 16, 100]} />
        <meshPhongMaterial color="#3b82f6" transparent opacity={0.6} />
      </mesh>

      {/* Animated Sphere */}
      <mesh position={[3, -2, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.5, 32, 32]} />
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.3}
          speed={2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Animated Box */}
      <mesh position={[0, 0, -3]} rotation={[Math.PI / 4, Math.PI / 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhongMaterial color="#ec4899" transparent opacity={0.6} />
      </mesh>

      {/* Floating particles */}
      {[...Array(50)].map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingIcons() {
  const icons = [
    { position: [5, 3, -5], color: '#3b82f6' },
    { position: [-5, 2, -3], color: '#8b5cf6' },
    { position: [0, -3, -4], color: '#ec4899' },
    { position: [-4, -2, -5], color: '#10b981' },
  ];

  return (
    <group>
      {icons.map((icon, i) => (
        <mesh key={i} position={icon.position} castShadow>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color={icon.color} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function AnimatedBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      
      <AnimatedShapes />
      <FloatingIcons />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}

