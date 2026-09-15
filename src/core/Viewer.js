import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Viewer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 0, 1500);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.topologyHelpers = [];

        this.showNodes = false;
        this.showPoints = true;

        this._setupResize();
    }

    _setupResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addMesh(mesh) {
        this.scene.add(mesh);
    }

    addTopologyHelper(helper) {
        this.scene.add(helper);
        this.topologyHelpers.push(helper);
    }

    toggleTopologyVisibility(visible) {
        this.topologyHelpers.forEach(helper => {
            helper.visible = visible;
        });
    }

    clearHelpers() {
        if (!this.topologyHelpers || !this.topologyHelpers.length) {
            return;
        }

        this.topologyHelpers.forEach(helper => {
            this.scene.remove(helper);
        });
    }

    setDefault() {
        this.camera.position.set(0, 0, 1500);
        this.topologyHelpers = [];
        this.showNodes = false;
        this.showPoints = true;
    }

    update() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}