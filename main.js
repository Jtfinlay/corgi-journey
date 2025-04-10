import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Make sure path is correct
import { Player } from './player.js';

// --- Basic Setup ---

const scene = new THREE.Scene();
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 5, 10);
scene.add(camera);

const canvas = document.querySelector('canvas.webgl');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xADD8E6);

// --- ✨ Add Lighting ✨ ---
// Ambient light: provides a base level of light everywhere
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
scene.add(ambientLight);

// Directional light: simulates sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // White light, stronger intensity
directionalLight.position.set(5, 10, 7.5); // Position the light source
scene.add(directionalLight);
// Optional: Add a helper to visualize the directional light's position
// const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
// scene.add(lightHelper);

// --- ✨ Renderer Encoding (Important for GLTF/Standard Materials) ✨ ---
renderer.outputColorSpace = THREE.SRGBColorSpace; // Use sRGBEncoding for versions before r152
// Optional: Set texture encoding if needed, though GLTFLoader often handles this
// renderer.textureEncoding = THREE.sRGBEncoding; // Deprecated, use texture.colorSpace instead if needed per-texture

// --- Objects ---

// Create the Player instance
const loader = new GLTFLoader();
let player; // Declare player variable

loader.load(
    'public/corgi.glb', // <-- REPLACE WITH ACTUAL PATH to your Corgi model
    (gltf) => {
        // Called when the model is loaded successfully
        const corgiModel = gltf.scene; // gltf.scene is usually the root object

        // --- Optional: Adjust model before passing it ---
        // Example: Center the model's pivot (depends on how the model was exported)
        // const box = new THREE.Box3().setFromObject(corgiModel);
        // const center = box.getCenter(new THREE.Vector3());
        // corgiModel.position.sub(center); // Move model so its center is at (0,0,0)

        // Example: Set initial rotation if needed (e.g., if it loads facing the wrong way)
        // corgiModel.rotation.y = Math.PI; // Rotate 180 degrees

        // --- Create the Player ---
        // Adjust startY based on the model's height/origin
        const modelHeight = 1; // Estimate or calculate model height
        const startY = modelHeight / 2;
        player = new Player(scene, corgiModel, startY);

        console.log('Corgi loaded and player created!');

        // Start the animation loop *after* the model is loaded
        animate();
    },
    (xhr) => {
        // Called while loading is progressing
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        // Called if there's an error loading the model
        console.error('An error happened loading the Corgi model:', error);
        // Maybe create a fallback box player here?
        // const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
        // const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
        // const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        // player = new Player(scene, fallbackMesh, 0.5);
        // animate(); // Start loop even with fallback
    }
);

// Ground Plane (Landscape)
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Add some simple polygon obstacles/scenery
const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(5, 0.8, -3);
scene.add(sphere);

const coneGeometry = new THREE.ConeGeometry(1, 2, 16);
const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xDAA520 });
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(-4, 1, 4);
scene.add(cone);


// --- Controls ---

const keysPressed = {}; // Keep track of currently pressed keys (remains global for now)

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keysPressed[key] = true;

    // Trigger jump via the player object
    if (key === ' ') {
        player.jump(); // Call the player's jump method
        // Optional: remove space from keysPressed immediately if you don't need to track holding it
        // delete keysPressed[' '];
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// --- Responsiveness ---

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- Animation Loop ---

const clock = new THREE.Clock();
let lastTime = 0;

const animate = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastTime;
    lastTime = elapsedTime;

    // Update the player instance, passing necessary info
    player.update(deltaTime, keysPressed);

    // Make the camera look at the player's mesh position
    camera.lookAt(player.position); // Use the getter or player.mesh.position

    // Optional camera follow logic (using player.position)
    // const cameraOffset = new THREE.Vector3(0, 5, 10);
    // const targetPosition = player.position.clone().add(cameraOffset);
    // camera.position.lerp(targetPosition, 0.1);
    // camera.lookAt(player.position);

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
};

animate();
