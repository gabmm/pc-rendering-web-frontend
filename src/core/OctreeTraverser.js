import * as THREE from 'three';
import { Config } from '../Constants.js';


export class OctreeTraverser {
    constructor() {
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();

        this.currentCamera = null;
        this.screenHeight = 0;
        this.visibleNodes = [];

        this.MIN_NODE_PIXEL_SIZE = Config.MIN_NODE_PIXEL_SIZE;
    }

    evaluate(rootNode, camera, screenHeight, currentFrame) {
        this.currentCamera = camera;
        this.screenHeight = screenHeight;
        this.visibleNodes = [];

        this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

        //slope é único por frame e não por nó
        const fovRad = THREE.MathUtils.degToRad(camera.fov);
        this.cameraSlope = Math.tan(fovRad / 2.0);

        if (rootNode) {
            this._traverse(rootNode, currentFrame);
        }

        return this.visibleNodes;
    }

    _traverse(node, currentFrame) {
        //testa o frustum
        if (!this.frustum.intersectsBox(node.boundingBox)) {
            return;
        }

        //calcula o projectedSize
        const projectedSize = this._calculateProjectedSize(node);

        //nó visitado sempre entra nos nós visíveis
        node.lastAccessed = currentFrame;
        this.visibleNodes.push({
            node: node,
            projectedSize: projectedSize
        });

        //se o nó visitado for suficientemente grande na tela, visita os filhos
        if (projectedSize >= this.MIN_NODE_PIXEL_SIZE && node.children.length > 0) {
            for (let i = 0; i < node.children.length; i++) {
                this._traverse(node.children[i], currentFrame);
            }
        }
    }

    _calculateProjectedSize(node) {
        const distance = this.currentCamera.position.distanceTo(node.center);

        if (distance === 0) return Infinity;

        return (this.screenHeight / 2.0) * (node.radius / (distance * this.cameraSlope));
    }
}