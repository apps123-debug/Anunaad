
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Earth3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 4.2;

    
const isMobile = window.matchMedia("(max-width: 650px)").matches;

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: !isMobile,
});

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    isMobile ? 1.25 : 2
  )
);

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -0.12;
    scene.add(earthGroup);

    scene.add(new THREE.AmbientLight(0x7899bb, 1.3));

    const sunlight = new THREE.DirectionalLight(0xffffff, 3.2);
    sunlight.position.set(-4, 2, 5);
    scene.add(sunlight);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    // EARTH SURFACE
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 12,
      specular: new THREE.Color(0x263f55),
    });

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(
  1.18,
  isMobile ? 48 : 96,
  isMobile ? 48 : 96
),
      earthMaterial
    );
    earthGroup.add(earth);

    // CLOUD LAYER
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(
  1.195,
  isMobile ? 48 : 96,
  isMobile ? 48 : 96
),
      cloudMaterial
    );
    earthGroup.add(clouds);

    // ATMOSPHERIC GLOW
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x43baff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          float intensity = pow(
            0.72 - dot(vNormal, normalize(vViewPosition)),
            3.0
          );
          gl_FragColor = vec4(glowColor, intensity * 0.65);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(
  1.29,
  isMobile ? 48 : 96,
  isMobile ? 48 : 96
),
      atmosphereMaterial
    );
    earthGroup.add(atmosphere);

    // LOAD EARTH TEXTURES
    loader.load(
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
      }
    );

    loader.load(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        cloudMaterial.map = texture;
        cloudMaterial.needsUpdate = true;
      }
    );

    // STARFIELD
    const starPositions = [];

    for (let i = 0; i < (isMobile ? 350 : 1100); i++) {
      starPositions.push(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 16 - 5
      );
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xc6eaff,
      size: 0.025,
      transparent: true,
      opacity: 0.75,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // SATELLITE ORBIT
    const orbitRadius = 1.72;
    const orbitTilt = 0.55;

    const orbitPoints = [];

    for (let i = 0; i <= 240; i++) {
      const angle = (i / 240) * Math.PI * 2;

      orbitPoints.push(
        new THREE.Vector3(
          orbitRadius * Math.cos(angle),
          orbitRadius * Math.sin(angle) * Math.cos(orbitTilt),
          orbitRadius * Math.sin(angle) * Math.sin(orbitTilt)
        )
      );
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
      orbitPoints
    );

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x79cbd0,
      transparent: true,
      opacity: 0.38,
    });

    const orbitLine = new THREE.LineLoop(
      orbitGeometry,
      orbitMaterial
    );

    earthGroup.add(orbitLine);

    // BUILD 3D SATELLITE
    const satellite = new THREE.Group();
    earthGroup.add(satellite);

    const satelliteBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5d6ad,
      metalness: 0.65,
      roughness: 0.35,
    });

    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x286d9b,
      metalness: 0.65,
      roughness: 0.3,
      emissive: 0x123b62,
      emissiveIntensity: 0.3,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.12, 0.16),
      satelliteBodyMaterial
    );
    satellite.add(body);

    // Solar panels
    const leftPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.025, 0.18),
      panelMaterial
    );
    leftPanel.position.x = -0.25;
    satellite.add(leftPanel);

    const rightPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.025, 0.18),
      panelMaterial
    );
    rightPanel.position.x = 0.25;
    satellite.add(rightPanel);

    // Antenna
    const antenna = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.13, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf4f0e5,
        metalness: 0.4,
      })
    );
    antenna.position.y = 0.12;
    antenna.rotation.z = Math.PI;
    satellite.add(antenna);

    // Satellite signal light
    const signalLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x8fffe0,
      })
    );
    signalLight.position.y = -0.1;
    satellite.add(signalLight);

    // MOVING DATA PARTICLES
    const particleCount = isMobile ? 35 : 85;
    const particlePositions = new Float32Array(particleCount * 3);

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8df5dc,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dataParticles = new THREE.Points(
      particleGeometry,
      particleMaterial
    );

    earthGroup.add(dataParticles);

    // EXPANDING EARTH SIGNAL RINGS
    const pulseRings = [];

    for (let i = 0; i < 3; i++) {
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x80d8c7 : 0x68c9db,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const pulse = new THREE.Mesh(
        new THREE.TorusGeometry(1.34, 0.008, 8, 100),
        pulseMaterial
      );

      pulse.rotation.x = Math.PI / 2;
      pulse.rotation.y = 0.35 + i * 0.4;
      earthGroup.add(pulse);

      pulseRings.push(pulse);
    }

    // ANIMATION
    const clock = new THREE.Clock();
    let animationFrame;

    function animate() {
  animationFrame = requestAnimationFrame(animate);

  if (document.hidden) return;

      const elapsed = clock.getElapsedTime();

      // Earth rotation and cloud movement
      earth.rotation.y += 0.0009;
      clouds.rotation.y += 0.00115;

      // Gentle floating motion
      earthGroup.position.y = Math.sin(elapsed * 0.5) * 0.035;

      // Stars
      stars.rotation.y = Math.sin(elapsed * 0.025) * 0.025;

      // Satellite movement around Earth
      const orbitAngle = elapsed * 0.42;

      const satelliteX = orbitRadius * Math.cos(orbitAngle);
      const satelliteY =
        orbitRadius * Math.sin(orbitAngle) * Math.cos(orbitTilt);
      const satelliteZ =
        orbitRadius * Math.sin(orbitAngle) * Math.sin(orbitTilt);

      satellite.position.set(
        satelliteX,
        satelliteY,
        satelliteZ
      );

      // Make satellite face its direction of travel
      satellite.lookAt(
        satelliteX - Math.sin(orbitAngle),
        satelliteY + Math.cos(orbitAngle) * Math.cos(orbitTilt),
        satelliteZ + Math.cos(orbitAngle) * Math.sin(orbitTilt)
      );

      // Animate the data particles along the orbit
      const positions = particleGeometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const angle =
          elapsed * 0.42 + (i / particleCount) * Math.PI * 2;

        positions[i * 3] = orbitRadius * Math.cos(angle);
        positions[i * 3 + 1] =
          orbitRadius * Math.sin(angle) * Math.cos(orbitTilt);
        positions[i * 3 + 2] =
          orbitRadius * Math.sin(angle) * Math.sin(orbitTilt);
      }

      particleGeometry.attributes.position.needsUpdate = true;

      // Pulsing signal rings
      pulseRings.forEach((pulse, i) => {
        const cycle = (elapsed * 0.32 + i / 3) % 1;

        const scale = 0.8 + cycle * 0.65;

        pulse.scale.set(scale, scale, scale);
        pulse.material.opacity =
          Math.sin(cycle * Math.PI) * 0.32;
      });

      // Gentle satellite signal light
      signalLight.scale.setScalar(
        1 + Math.sin(elapsed * 5) * 0.22
      );

      renderer.render(scene, camera);
    }

    animate();

    // RESPONSIVE SIZING
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    resizeObserver.observe(container);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="earth-3d-container"
      role="img"
      aria-label="Animated 3D Earth with orbiting satellite, moving data particles, clouds and atmospheric signal rings"
    />
  );
}
