import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class Ground {
    constructor(scene) {
        this.scene = scene;
        this.groundSize = 100;
        this.groundSegments = 100;
        // this.groundHeight = 0.5;
        this.noise2d = createNoise2D();

        this.groundGeometry = new THREE.PlaneGeometry(
            this.groundSize,
            this.groundSize,
            this.groundSegments,
            this.groundSegments
        );
        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x228b22,
            side: THREE,
        });
        this.ground = new THREE.Mesh(this.groundGeometry, this.groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.name = 'ground';
        this.generateTerrain();
        this.scene.add(this.ground);
    }

    generateTerrain() {
        const positionAttribute = this.groundGeometry.attributes.position;
        const vertex = new THREE.Vector3();

        // --- Terrain Parameters ---
        // Adjust these values to change the terrain's appearance
        const noiseScale = 0.04; // Lower value = larger, broader features. Higher value = smaller, more frequent features.
        const noiseHeight = 2; // Maximum height difference (amplitude) of the hills/valleys.

        console.log('Generating terrain...'); // Optional: log progress

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i); // Get vertex x, y, z

            // Calculate noise coordinates based on vertex position
            const noiseX = vertex.x * noiseScale;
            const noiseY = vertex.y * noiseScale;

            // Sample noise at this point
            const noiseValue = this.noise2d(noiseX, noiseY);

            // Apply noise to the vertex's z-coordinate (height)
            const heightOffset = noiseValue * noiseHeight;

            // Apply the height offset to the z-coordinate of the plane vertex
            // This becomes the y-coordinate in world space after rotation
            positionAttribute.setZ(i, heightOffset);
        }

        // Important: Tell Three.js that the vertex positions have been updated
        positionAttribute.needsUpdate = true;
        // Recalculate normals for correct lighting on the varied terrain
        this.groundGeometry.computeVertexNormals();

        console.log('Terrain generated.'); // Optional: log completion
    }
}
