import * as THREE from 'three';

export class Player {
    // Modified constructor to accept a loaded model
    constructor(scene, loadedModel, startY = 0) {
        // Default startY might need adjustment based on model size/origin
        this.scene = scene;
        this.startY = startY; // This might need fine-tuning based on your model's pivot point
        this.model = loadedModel;

        // --- Mesh Setup ---
        this.mesh = this.model.scene; // Use the passed-in model

        // --- Model Adjustments (Example - You'll likely need to tweak these) ---
        // Scale the model if necessary (adjust values as needed)
        this.mesh.scale.set(0.8, 0.8, 0.8);

        // Ensure the model's position is set correctly
        this.mesh.position.y = this.startY;
        // You might need to adjust x and z starting positions too
        // this.mesh.position.x = 0;
        // this.mesh.position.z = 0;

        // Add the loaded model to the scene
        this.scene.add(this.mesh);

        // --- Animations ---
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.runAnimation = this.mixer.clipAction(this.model.animations[0], this.model.scene);
        this.runAnimation.setLoop(THREE.LoopRepeat, Infinity);
        this.runAnimation.clampWhenFinished = true;
        this.runAnimation.timeScale = 2.5;

        // --- Physics & Control Properties ---
        this.moveSpeed = 0.15;
        this.velocityY = 0;
        this.gravity = 0.015;
        this.jumpStrength = 0.3;
        this.isGrounded = true;
        // offset for the model's rotation (depends on how the model was exported)
        this.modelRotationY = -Math.PI / 2;

        // --- Rotation Helper ---
        this.moveDirection = new THREE.Vector3(); // To store movement direction
        this.rotateQuaternion = new THREE.Quaternion();
        this.targetQuaternion = new THREE.Quaternion();
        this.rotationSlerpFactor = 0.15; // How quickly the model turns (adjust for desired smoothness)
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpStrength;
            this.isGrounded = false;
        }
    }

    update(deltaTime, keysPressed) {
        // --- Calculate Movement Vector ---
        const moveX = (keysPressed['d'] ? 1 : 0) - (keysPressed['a'] ? 1 : 0); // 1 for right, -1 for left, 0 for none
        const moveZ = (keysPressed['s'] ? 1 : 0) - (keysPressed['w'] ? 1 : 0); // 1 for back, -1 for forward, 0 for none

        this.moveDirection.set(moveX, 0, moveZ).normalize(); // Normalize for consistent speed diagonally

        this.mixer.update(deltaTime);

        // --- Apply Horizontal Movement ---
        const velocity = this.moveDirection.clone().multiplyScalar(this.moveSpeed); // Use deltaTime for frame-rate independence: multiplyScalar(this.moveSpeed * deltaTime)
        this.mesh.position.x += velocity.x;
        this.mesh.position.z += velocity.z;

        // IMPORTANT NOTE FOR PLAYER PHYSICS:
        // With uneven terrain, the Player's current gravity and isGrounded logic
        // (which assumes a flat ground at player.startY) will NOT work correctly.
        // The player will float or sink through the hills.
        //
        // To fix this, you will need to implement raycasting in the Player.update method:
        // 1. Create a THREE.Raycaster.
        // 2. Set the raycaster's origin slightly above the player's feet (player.mesh.position).
        // 3. Set the raycaster's direction to point straight down (0, -1, 0).
        // 4. Use raycaster.intersectObject(ground) to find the intersection point with the ground mesh.
        // 5. If there's an intersection, the distance to the intersection point tells you
        //    how far the player is from the ground directly below them.
        // 6. Use this distance to adjust the player's y-position and determine if they are grounded.
        // This is a more advanced topic but necessary for interaction with varied terrain.
        // --- Raycasting for Ground Detection ---
        const raycaster = new THREE.Raycaster();
        const rayOrigin = new THREE.Vector3(
            this.mesh.position.x,
            this.mesh.position.y + 0.5,
            this.mesh.position.z
        ); // Slightly above the player
        const rayDirection = new THREE.Vector3(0, -1, 0); // Downwards
        raycaster.set(rayOrigin, rayDirection);

        // Assuming you have a 'ground' object in your scene
        const ground = this.scene.getObjectByName('ground'); // Replace 'ground' with your ground's name
        if (ground) {
            const intersects = raycaster.intersectObject(ground);

            if (intersects.length > 0) {
                const intersection = intersects[0];
                const distanceToGround = intersection.distance;

                // Adjust player's y-position based on distance to ground
                this.mesh.position.y = rayOrigin.y - distanceToGround;

                // Check if the player is close enough to be considered grounded
                this.isGrounded = distanceToGround < 0.6; // Adjust threshold as needed
                if (this.isGrounded) {
                    this.velocityY = 0;
                }
            } else {
                // If no intersection, player is not on the ground
                this.isGrounded = false;
            }
        }

        // --- Handle Rotation ---
        if (moveX !== 0 || moveZ !== 0) {
            // Calculate the angle the player should face
            const angle = Math.atan2(moveX, moveZ) + this.modelRotationY; // Note: atan2(x, z) gives angle relative to positive Z axis

            // Set the target rotation quaternion
            this.targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

            // Smoothly interpolate rotation using slerp
            this.mesh.quaternion.slerp(this.targetQuaternion, this.rotationSlerpFactor);
        }

        // --- Vertical Movement (Jumping/Gravity) ---
        if (!this.isGrounded) {
            this.velocityY -= this.gravity; // Consider multiplying by deltaTime
            this.mesh.position.y += this.velocityY; // Consider multiplying by deltaTime

            if (this.mesh.position.y <= this.startY) {
                this.mesh.position.y = this.startY;
                this.velocityY = 0;
                this.isGrounded = true;
            }
        }

        // Apply run animation from the model, called 'RunCycle' in the glb file
        if (this.moveDirection.length() > 0) {
            this.runAnimation.play();
            // runAnimation.rotation.y = this.mesh.rotation.y; // Match the player's rotation
        } else {
            this.runAnimation.stop();
        }
    }

    get position() {
        return this.mesh.position;
    }
}
