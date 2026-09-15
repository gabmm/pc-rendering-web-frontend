import * as THREE from 'three';
import { NODE_STATUS, BOUNDING_BOX_COLORS } from '../Constants.js';

export class OctreeNode {
    constructor(id, boundingBox, numPoints, depth) {
        this.id = id;
        this.boundingBox = boundingBox;
        this.depth = depth;
        this.helper = this._createHelper(this.boundingBox, this.depth);
        this.numPoints = numPoints;
        this.depth = depth;
        this.children = [];

        this.center = new THREE.Vector3();
        this.boundingBox.getCenter(this.center);

        const dx = boundingBox.max.x - boundingBox.min.x;
        const dy = boundingBox.max.y - boundingBox.min.y;
        const dz = boundingBox.max.z - boundingBox.min.z;
        this.radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2.0;

        this.status = NODE_STATUS.UNLOADED;
        this.abortController = null;
        this.lastAccessed = 0;
        this.geometry = null;
        this.mesh = null;
    }

    _createHelper(boundingBox, depth) {
        const colorIndex = depth % BOUNDING_BOX_COLORS.length;
        const nodeColor = BOUNDING_BOX_COLORS[colorIndex];
        const helper = new THREE.Box3Helper(boundingBox, nodeColor);
        helper.visible = false;
        return helper;
    }
}