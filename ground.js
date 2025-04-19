import * as THREE from 'three';

export class Ground {
    constructor(scene) {
        this.scene = scene;
        this.groundSize = 100;
        this.groundSegments = 100;
        this.groundHeight = 1;
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
        const peakHeight = 5; // Maximum height of the hills
        const frequency = 0.05; // How close together the hills/valleys are (lower value = wider features)
        const complexity = 0.08; // Adds some smaller variations

        console.log('Generating terrain...'); // Optional: log progress

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i); // Get vertex x, y, z

            // Calculate height offset using sine waves (simple example)
            // You could use more complex noise functions (like Perlin/Simplex) for more natural terrain
            const heightOffset =
                (Math.sin(vertex.x * frequency) * Math.cos(vertex.y * frequency) + // Base hills
                    Math.sin(vertex.x * complexity * 5) *
                        Math.cos(vertex.y * complexity * 5) *
                        0.3) * // Smaller details
                peakHeight;

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
