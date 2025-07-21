import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Işıklar
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 3, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Texture loader
const loader = new THREE.TextureLoader();

// Arka plan - yıldızlar
loader.load('textures/stars.jpg', function(texture){
  scene.background = texture;
});

// Güneş
const sunGeo = new THREE.SphereGeometry(4.5, 64, 64);

const sunTexture = loader.load(
  'textures/sun.jpg',
  () => console.log("Güneş texture yüklendi."),
  undefined,
  (err) => console.error("Güneş texture yüklenemedi:", err)
);

const sunMat = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffff00),
  emissiveIntensity: 0.2,
  roughness: 0.5,
  metalness: 0.1,
});

const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Gezegen oluşturma fonksiyonu
function createPlanet(texturePath, size, distance, speed) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const texture = loader.load(texturePath);
  const material = new THREE.MeshStandardMaterial({ 
    map: texture,
    roughness: 0.7,
    metalness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { distance, speed, angle: Math.random() * Math.PI * 2 };
  scene.add(mesh);
  return mesh;
}

// Gezegenler
const planets = [
  createPlanet('textures/mercury.jpg', 0.4, 5 * 1.5, 0.02 * 0.5),
  createPlanet('textures/venus.jpg', 0.9, 7 * 1.5, 0.015 * 0.5),
  createPlanet('textures/earth.jpg', 1.1, 9 * 1.5, 0.01 * 0.5),
  createPlanet('textures/mars.jpg', 0.8, 11 * 1.5, 0.008 * 0.5),
  createPlanet('textures/jupiter.jpg', 2.0, 14 * 1.5, 0.005 * 0.5),
  createPlanet('textures/saturn.jpg', 1.8, 17 * 1.5, 0.004 * 0.5),
  createPlanet('textures/uranus.jpg', 1.2, 20 * 1.5, 0.003 * 0.5),
  createPlanet('textures/neptune.jpg', 1.2, 23 * 1.5, 0.002 * 0.5),
];

// Satürn halkası
const ringGeo = new THREE.RingGeometry(2.2, 3.2, 64);
const ringTexture = loader.load('textures/saturn_ring.png');
const ringMat = new THREE.MeshBasicMaterial({
  map: ringTexture,
  side: THREE.DoubleSide,
  transparent: true,
});
const saturnRing = new THREE.Mesh(ringGeo, ringMat);
const saturn = planets[5];
saturn.add(saturnRing);
saturnRing.rotation.x = Math.PI / 2;

// Kamera ayarı - yukarıda ve merkeze bakıyor
camera.position.set(0, 5, 50);
camera.lookAt(0, 0, 0);

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  // Gezegen hareketi
  planets.forEach(planet => {
    planet.userData.angle += planet.userData.speed;
    planet.position.set(
      Math.cos(planet.userData.angle) * planet.userData.distance,
      0,  // Gezegenleri 3 birim yukarı taşıdık
      Math.sin(planet.userData.angle) * planet.userData.distance
    );
    planet.rotation.y += 0.01;
  });

  // Güneş dönüyor
  sun.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();
