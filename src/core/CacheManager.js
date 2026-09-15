import { Config, NODE_STATUS } from '../Constants.js';

export class CacheManager {
    constructor(viewer) {
        this.viewer = viewer
        this.loadedNodes = new Set();
        this.MAX_AGE_FRAMES = Config.MAX_AGE_FRAMES;
    }

    registerNode(node) {
        this.loadedNodes.add(node);
    }

    sweep(currentFrame) {
        for (const node of this.loadedNodes) {
            if ((currentFrame - node.lastAccessed) > this.MAX_AGE_FRAMES) {
                this._evict(node);
                this.loadedNodes.delete(node);
            }
        }
    }

    swipeAll() {
        for (const node of this.loadedNodes) {
            this._evict(node);
            this.loadedNodes.delete(node);
        }
    }

    _evict(node) {
        console.log(`[Cache] Removendo nó ID ${node.id}`);

        if (node.mesh) {
            this.viewer.scene.remove(node.mesh);
            node.mesh = null;
        }

        if (node.geometry) {
            node.geometry.dispose();
            node.geometry = null;
        }

        node.status = NODE_STATUS.UNLOADED;
    }
}