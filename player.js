import * as THREE from 'three';

export class Player {
    // Modified constructor to accept a loaded model
    constructor(scene, loadedModel, startY = 0) { // Default startY might need adjustment based on model size/origin
        this.scene = scene;
        this.startY = startY; // This might need fine-tuning based on your model's pivot point

        // --- Mesh Setup ---
        this.mesh = loadedModel; // Use the passed-in model

        // --- Model Adjustments (Example - You'll likely need to tweak these) ---
        // Scale the model if necessary (adjust values as needed)
        // this.mesh.scale.set(0.5, 0.5, 0.5);

        // Ensure the model's position is set correctly
        this.mesh.position.y = this.startY;
        // You might need to adjust x and z starting positions too
        // this.mesh.position.x = 0;
        // this.mesh.position.z = 0;

        // Add the loaded model to the scene
        this.scene.add(this.mesh);

        // --- Physics & Control Properties ---
        this.moveSpeed = 0.1;
        this.velocityY = 0;
        this.gravity = 0.015;
        this.jumpStrength = 0.3;
        this.isGrounded = true;

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

        // --- Apply Horizontal Movement ---
        const velocity = this.moveDirection.clone().multiplyScalar(this.moveSpeed); // Use deltaTime for frame-rate independence: multiplyScalar(this.moveSpeed * deltaTime)
        this.mesh.position.x += velocity.x;
        this.mesh.position.z += velocity.z;

        // --- Handle Rotation ---
        if (moveX !== 0 || moveZ !== 0) {
            // Calculate the angle the player should face
            const angle = Math.atan2(moveX, moveZ); // Note: atan2(x, z) gives angle relative to positive Z axis

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
    }

    get position() {
        return this.mesh.position;
    }
}
