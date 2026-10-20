import * as THREE from 'three';
import CameraControls from 'camera-controls';
CameraControls.install({ THREE: THREE });

export class Viewer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 0, 500);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.topologyHelpers = [];

        this.showNodes = false;
        this.showPoints = true;

        this._setupResize();

        this.camera.up.set(0, 0, 1);


        this.timer = new THREE.Timer();
        this.controls = new CameraControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = Infinity;
        this.controls.updateCameraUp();
        this.controls.dollyToCursor = false;
        this.controls.infinityDolly = true;
        this.controls.smoothTime = 0.3;
        this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
        this.controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
        this.controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
        this.controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
        this.controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
        this.controls.touches.three = CameraControls.ACTION.TOUCH_TRUCK;
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

    adjustCamera(bbox) {
        // const camX = 0;
        // const camY = bbox.max.y / 2;
        // const camZ = bbox.max.z / 4;
        // this.camera.position.set(camX, camY, camZ);

        // this.controls.target.set(targetX, targetY, targetZ);
        // this.controls.update();

        this.controls.fitToBox(bbox, true, {
            paddingTop: 2,
            paddingLeft: 2,
            paddingBottom: 2,
            paddingRight: 2
        })
    }

    clearHelpers() {
        if (!this.topologyHelpers || !this.topologyHelpers.length) {
            return;
        }

        this.topologyHelpers.forEach(helper => {
            this.scene.remove(helper);
            if (helper.geometry) helper.geometry.dispose();
            if (helper.material) helper.material.dispose();
        });

        this.topologyHelpers = [];
    }

    setDefault() {
        this.controls.enabled = true;
        this.controls.reset(false);
        this.clearHelpers();
        this.renderer.renderLists.dispose();
        this.showNodes = false;
        this.showPoints = true;
        this.timer.reset();
        this.update();
    }

    update(delta) {
        this.controls.update(delta)
        this.renderer.render(this.scene, this.camera);
    }
}