import * as THREE from 'three';
import { OctreeNode } from '../core/OctreeNode.js';
import { Config } from '../Constants.js';

export class OctreeLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.totalPoints = 0;
    }

    async load() {
        try {
            console.log("[OctreeLoader] Iniciando requisição da topologia da octree...");
            const response = await fetch(`${Config.SERVER_URL}/octree.json`);

            if (!response.ok) {
                throw new Error(`[Server] Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const pcData = await response.json();
            const rootNode = this._parseNode(pcData.root);
            Config.setHasColor(pcData.hasColor);

            console.log("[OctreeMapLoader] Point Cloud com cor?", Config.HAS_COLOR);
            console.log("[OctreeMapLoader] Topologia mapeada!", rootNode);
            return rootNode;
        } catch (e) {
            console.error("[OctreeMapLoader] Falha ao carregar topologia:", e);
        }
    }

    _parseNode(jsonData) {
        const min = new THREE.Vector3(...jsonData.min);
        const max = new THREE.Vector3(...jsonData.max);
        const nodeBbox = new THREE.Box3(min, max);
        const numPoints = parseInt(jsonData.num_points, 10) || 0;
        this.totalPoints += numPoints;

        const node = new OctreeNode(
            jsonData.id,
            nodeBbox,
            numPoints,
            jsonData.depth,
        );

        this.viewer.addTopologyHelper(node.helper);

        (jsonData.children || []).forEach(child => {
            if (child.num_points && child.num_points > 0) {
                node.children.push(this._parseNode(child));
            }
        });

        return node;
    }
}