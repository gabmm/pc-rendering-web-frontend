import * as THREE from 'three';
import { Config, NODE_STATUS } from '../Constants.js';

export class BinFetcher {
    constructor(viewer, cacheManager) {
        this.viewer = viewer;
        this.cacheManager = cacheManager;
        this.activeFetches = new Set(); //controlador de requisições
        this.MAX_CONCURRENT_FETCHES = Config.MAX_CONCURRENT_FETCHES;
        this.enableFetching = true;
    }

    processFetchQueue(visibleQueue) {
        if (!this.enableFetching) return;

        //joga pra um set para melhor performance
        const idsToFetch = new Set();
        visibleQueue.forEach(item => idsToFetch.add(item.node.id));

        //controle de cancelamento. Se o no que está na fila de req. deixou de ser visível, deve ser abortado
        for (const node of this.activeFetches) {
            if (!idsToFetch.has(node.id)) {
                node.abortController.abort();
                node.status = NODE_STATUS.UNLOADED;
                node.abortController = null;
                this.activeFetches.delete(node);
                console.log(`[Rede] Abortado nó ID ${node.id}`);
            }
        }

        //orquestra o fetch de nós
        for (const item of visibleQueue) {
            //garante apenas uma quantidade máxima de requisiç~oes paralelas
            if (this.activeFetches.size >= this.MAX_CONCURRENT_FETCHES) {
                break;
            }

            if (item.node.status === NODE_STATUS.UNLOADED) {
                this._fetchNode(item.node);
            }
        }
    }

    async _fetchNode(node) {
        node.status = NODE_STATUS.LOADING;
        node.abortController = new AbortController();
        this.activeFetches.add(node);

        try {
            console.log(`[Rede] Iniciando requisição do arquivo ${node.id}.bin...`);
            //const response = await fetch(`${Config.SERVER_URL}/${Config.BIN_ROUTE}/${node.id}.bin`, {
            const response = await fetch(`${Config.SERVER_URL}/${node.id}.bin`, {
                signal: node.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`[Server] Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const binBuffer = await response.arrayBuffer();
            //const typedArray = new Float32Array(binBuffer);
            const pointMesh = this._buildMesh(binBuffer, Config.HAS_COLOR);

            node.geometry = pointMesh.geometry;
            node.mesh = pointMesh;
            node.status = NODE_STATUS.LOADED;

            this.viewer.addMesh(pointMesh);
            this.cacheManager.registerNode(node);

            //const totalPoints = typedArray.length / 3;
            //console.log(`[Rede] Nó carregado e renderizado! Total de Pontos: ${totalPoints}`);
        } catch (e) {
            if (e.name === 'AbortError') {
                //do nothing
            } else {
                console.error("[Rede] Falha ao carregar arquivo:", e.message);
                node.status = NODE_STATUS.UNLOADED;
            }
        } finally {
            this.activeFetches.delete(node);
            node.abortController = null;
        }
    }

    _buildMesh(arrayBuffer, hasColor = false) {
        const geometry = new THREE.BufferGeometry();
        let material;

        if (hasColor) {
            const positionArray = new Float32Array(arrayBuffer);
            const positionBuffer = new THREE.InterleavedBuffer(positionArray, 4);
            geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(positionBuffer, 3, 0));

            const colorArray = new Uint8Array(arrayBuffer);
            const colorBuffer = new THREE.InterleavedBuffer(colorArray, 16);
            geometry.setAttribute('color', new THREE.InterleavedBufferAttribute(colorBuffer, 3, 12, true))

            material = new THREE.PointsMaterial({
                size: 0.1,
                sizeAttenuation: true,
                vertexColors: true
            });

        } else {
            const positionArray = new Float32Array(arrayBuffer);
            geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

            material = new THREE.PointsMaterial({
                color: 0x00ff00,
                size: 0.1,
                sizeAttenuation: true
            });
        }

        return new THREE.Points(geometry, material);
    }

    abortAll() {
        console.log(`[Rede] Abortando ${this.activeFetches.size} downloads em andamento.`);
        for (const node of this.activeFetches) {
            node.abortController.abort();
        }
        this.activeFetches.clear();
    }
}