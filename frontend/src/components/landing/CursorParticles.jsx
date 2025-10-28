import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function StarParticle({ initialPosition, index, total }) {
  const meshRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Smooth follow effect based on mouse position
      const lag = 0.04 * (index / total);
      const targetX = mouseRef.current.x * 4;
      const targetY = mouseRef.current.y * 3;
      
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * lag;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * lag;

      // Gentle floating animation
      meshRef.current.position.z += Math.sin(clock.elapsedTime * 0.5 + index) * 0.001;

      // Rotation
      meshRef.current.rotation.z = clock.elapsedTime * 0.2 + index;
    }
  });

  // Create star shape geometry
  const createStarShape = () => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 0.06;
    const innerRadius = 0.03;
    
    for (let i = 0; i <= spikes * 2; i++) {
      const angle = (Math.PI * 2 / spikes) * (i / 2);
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    
    return shape;
  };

  return (
    <mesh
      ref={meshRef}
      position={initialPosition}
    >
      <shapeGeometry args={[createStarShape()]} />
      <meshBasicMaterial 
        color="#60a5fa" 
        transparent 
        opacity={0.2 + Math.random() * 0.3}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function WireframeCircleParticle({ initialPosition, index, total }) {
  const meshRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const lag = 0.05 * (index / total);
      const targetX = mouseRef.current.x * 3;
      const targetY = mouseRef.current.y * 2;
      
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * lag;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * lag;

      // Gentle rotation
      meshRef.current.rotation.z = clock.elapsedTime * 0.1 + index;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={initialPosition}
    >
      <circleGeometry args={[0.08, 8]} />
      <meshBasicMaterial 
        color="#8b5cf6" 
        transparent 
        opacity={0.15}
        wireframe
      />
    </mesh>
  );
}

export default function CursorReactiveParticles() {
  const [particles] = useState(() => {
    // Detect if mobile for performance optimization
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const starCount = isMobile ? 40 : 60;
    const circleCount = isMobile ? 25 : 30;

    // Generate star particles
    const stars = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      type: 'star',
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        Math.random() * -4 - 1,
      ],
    }));

    // Generate circle particles
    const circles = Array.from({ length: circleCount }, (_, i) => ({
      id: i + starCount,
      type: 'circle',
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        Math.random() * -3,
      ],
    }));

    return [...stars, ...circles];
  });

  return (
    <group>
      {particles.map((particle, index) =>
        particle.type === 'star' ? (
          <StarParticle
            key={particle.id}
            initialPosition={particle.position}
            index={index}
            total={particles.length}
          />
        ) : (
          <WireframeCircleParticle
            key={particle.id}
            initialPosition={particle.position}
            index={index}
            total={particles.length}
          />
        )
      )}
    </group>
  );
}
