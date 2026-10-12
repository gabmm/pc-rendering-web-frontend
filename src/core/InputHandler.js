import { Config } from '../Constants.js';
import * as THREE from 'three';

export class InputHandler {
    constructor(viewer, cacheManager, binFetcher, telemetry) {
        this.INITIAL_POINT_BUDGET = Config.POINT_BUDGET;
        this.INITIAL_POINT_SIZE = Config.POINT_SIZE;
        this.viewer = viewer;
        this.cacheManager = cacheManager;
        this.binFetcher = binFetcher;
        this.isTopologyVisible = true;
        this.budgetSlider = document.getElementById('budgetSlider');
        this.budgetValueDisplay = document.getElementById('budgetValueDisplay');
        this.sizeSlider = document.getElementById('sizeSlider');
        this.sizeValueDisplay = document.getElementById('sizeValueDisplay');
        this.telemetry = telemetry;
        this._setupKeyboard();
    }

    _setupKeyboard() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 't' || event.key === 'T') {
                this._toggleTopologyHelpers();
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                this.binFetcher.enableFetching = !this.binFetcher.enableFetching;
                console.log(`[InputHandler] Fetch de nós alterado para: ${this.binFetcher.enableFetching}`);
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'n' || event.key === 'N') {
                this.viewer.showNodes = !this.viewer.showNodes;
                console.log(`[InputHandler] Visibilidade dos nós alterado para: ${this.viewer.showNodes}`);
                if (this.viewer.showNodes === false) {
                    this.viewer.toggleTopologyVisibility(false);
                }
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'l' || event.key === 'L') {
                this.cacheManager.swipeAll();
                console.log(`[InputHandler] Nós excluídos`);
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'c' || event.key === 'C') {
                const pos = new THREE.Vector3();
                const target = new THREE.Vector3();

                this.viewer.controls.getPosition(pos);
                this.viewer.controls.getTarget(target);

                const currentSize = this.binFetcher.pointMaterial.size;

                const configString = `
                    "${Config.CLOUD_NAME}": {
                        position: { x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)} },
                        target: { x: ${target.x.toFixed(2)}, y: ${target.y.toFixed(2)}, z: ${target.z.toFixed(2)} },
                        pointSize: ${currentSize.toFixed(3)}
                    },`;

                console.log(configString);
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'r' || event.key === 'R') {
                if (!this.telemetry.isRecording) {
                    this.telemetry.startRecording();
                } else {
                    this.telemetry.stopRecording();
                }
            }
        });

        if (this.budgetSlider && this.budgetValueDisplay) {
            this.budgetSlider.addEventListener('input', (event) => {
                const newBudget = parseInt(event.target.value, 10);
                this.budgetValueDisplay.innerText = (newBudget / 1000000).toFixed(1) + ' M';
                Config.setPointBudget(newBudget);
            });
        } else {
            console.warn("[InputHandler] Elementos do Budget Slider não encontrados no DOM.");
        }

        if (this.sizeSlider && this.sizeValueDisplay) {
            this.sizeSlider.addEventListener('input', (event) => {
                const newSize = parseFloat(event.target.value);
                this.sizeValueDisplay.innerText = newSize.toFixed(3);
                Config.setPointSize(newSize);
                this.binFetcher.pointMaterial.size = newSize;
                this.binFetcher.pointMaterial.needsUpdate = true;
            });
        } else {
            console.warn("[InputHandler] Elementos do Size Slider não encontrados no DOM.");
        }
    }

    _toggleTopologyHelpers() {
        this.isTopologyVisible = !this.isTopologyVisible;
        this.viewer.toggleTopologyVisibility(this.isTopologyVisible);
        console.log(`[InputHandler] Visibilidade da topologia alterada para: ${this.isTopologyVisible}`);
    }

    setDefault() {
        this.isTopologyVisible = true;
        Config.setPointBudget(this.INITIAL_POINT_BUDGET);
        this.budgetValueDisplay.innerText = (this.INITIAL_POINT_BUDGET / 1000000).toFixed(1) + ' M';
        this.budgetSlider.value = this.INITIAL_POINT_BUDGET;
        Config.setPointSize(this.INITIAL_POINT_SIZE);
        this.binFetcher.pointMaterial.size = this.INITIAL_POINT_SIZE;
        this.sizeValueDisplay.innerText = this.INITIAL_POINT_SIZE.toFixed(3);
        this.sizeSlider.value = this.INITIAL_POINT_SIZE;
    }
}