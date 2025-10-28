import { useRef } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import CursorReactiveParticles from './CursorParticles';

function FloatingIcon({ position, color, speed = 1 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * speed;
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed + position[0]) * 0.3;
      meshRef.current.position.x = position[0] + Math.cos(clock.elapsedTime * speed * 0.5) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.8, 0.8, 0.1]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function NetworkNode({ position, delay = 0, color }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5 + delay) * 0.2;
      meshRef.current.rotation.y = clock.elapsedTime * 0.3 + delay;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.6}
        toneMapped={false}
      />
    </mesh>
  );
}

function ConnectionLine({ start, end, color = '#3b82f6' }) {
  const points = useRef([new THREE.Vector3(...start), new THREE.Vector3(...end)]);
  const geometry = useRef(new THREE.BufferGeometry());

  useFrame(() => {
    geometry.current.setFromPoints(points.current);
  });

  return (
    <line geometry={geometry.current}>
      <lineBasicMaterial 
        color={color} 
        opacity={0.3} 
        transparent 
      />
    </line>
  );
}

function RotatingRing({ position, color, radius = 2 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[radius - 0.05, radius, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.4} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

function Particle({ position, color }) {
  const meshRef = useRef();
  const originalY = position[1];
  const floatSpeed = Math.random() * 0.5 + 0.3;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = originalY + Math.sin(clock.elapsedTime * floatSpeed) * 0.5;
      meshRef.current.rotation.z = clock.elapsedTime * floatSpeed;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.7}
      />
    </mesh>
  );
}

function SceneContent() {
  // Network nodes representing data flow
  const nodes = [
    { pos: [-1.5, 0.5, 0.5], color: '#3b82f6', delay: 0 },
    { pos: [1.5, 0.5, 0.5], color: '#8b5cf6', delay: 0.2 },
    { pos: [-1.2, -0.8, -0.5], color: '#10b981', delay: 0.4 },
    { pos: [1.2, -0.8, -0.5], color: '#f59e0b', delay: 0.6 },
    { pos: [0, 1.5, 0], color: '#ec4899', delay: 0.8 },
  ];

  // Floating business elements
  const icons = [
    { pos: [-2, 0.5, -1.5], color: '#3b82f6', speed: 0.4 },
    { pos: [2.2, 0.3, -1.8], color: '#8b5cf6', speed: 0.6 },
    { pos: [-1.5, -1, 1.5], color: '#10b981', speed: 0.5 },
    { pos: [1.5, -0.5, 1], color: '#ec4899', speed: 0.7 },
  ];

  return (
    <>
      <ambientLight intensity={1} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8b5cf6" />
      <directionalLight position={[0, 5, 5]} intensity={1} />

      {/* Central hub - representing AI/Data processing */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial 
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Network nodes */}
      {nodes.map((node, index) => (
        <NetworkNode 
          key={index} 
          position={node.pos} 
          color={node.color}
          delay={node.delay} 
        />
      ))}

      {/* Connection lines */}
      <ConnectionLine start={[0, 0, 0]} end={nodes[0].pos} color="#3b82f6" />
      <ConnectionLine start={[0, 0, 0]} end={nodes[1].pos} color="#8b5cf6" />
      <ConnectionLine start={[0, 0, 0]} end={nodes[2].pos} color="#10b981" />
      <ConnectionLine start={[0, 0, 0]} end={nodes[3].pos} color="#f59e0b" />
      <ConnectionLine start={[0, 0, 0]} end={nodes[4].pos} color="#ec4899" />
      <ConnectionLine start={nodes[0].pos} end={nodes[2].pos} color="#3b82f6" />
      <ConnectionLine start={nodes[1].pos} end={nodes[3].pos} color="#8b5cf6" />

      {/* Floating business icons */}
      {icons.map((icon, index) => (
        <FloatingIcon 
          key={index} 
          position={icon.pos} 
          color={icon.color}
          speed={icon.speed}
        />
      ))}

      {/* Rotating rings - representing data orbits */}
      <RotatingRing position={[0, 0, -2]} color="#8b5cf6" radius={1.8} />
      <RotatingRing position={[0, 0, 1.5]} color="#ec4899" radius={2.2} />

      {/* Floating particles representing data */}
      {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40)].map((_, i) => (
        <Particle
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 8 - 2,
          ]}
          color="#60a5fa"
        />
      ))}

      {/* Cursor-reactive wireframe particles */}
      <CursorReactiveParticles />
    </>
  );
}

export default function HeroScene() {
  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[450px] lg:min-h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/30 to-pink-500/20">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        className="w-full h-full"
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 2]} // Limit pixel ratio for better mobile performance
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
        <SceneContent />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-600/10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-600/10 pointer-events-none"></div>
    </div>
  );
}
