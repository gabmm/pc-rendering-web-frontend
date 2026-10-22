import { Viewer } from './core/Viewer.js';
import { InputHandler } from './core/InputHandler.js';
import { OctreeLoader } from './loaders/OctreeLoader.js';
import { BinFetcher } from './loaders/BinFetcher.js';
import { OctreeTraverser } from './core/OctreeTraverser.js';
import { CacheManager } from './core/CacheManager.js';
import { Telemetry } from './core/Telemetry.js';
import { Config } from './Constants.js';
import { buildDatasetTableUI, applyCloudSettings } from './CloudDefaultSettings.js';
import { Trajectory } from './core/Trajectory.js';

const viewer = new Viewer();
const telemetry = new Telemetry(viewer.renderer);
const octreeLoader = new OctreeLoader(viewer);
const octreeTraverser = new OctreeTraverser();
const cacheManager = new CacheManager(viewer);
const binFetcher = new BinFetcher(viewer, cacheManager);
const inputHandler = new InputHandler(viewer, cacheManager, binFetcher, telemetry);
buildDatasetTableUI();

let activeTrajectory = null;
let rootNode = null;
let previousVisibleQueue = [];
let visibleQueue = [];
let frameCount = 0;
let frameCountForFps = 0;
let visiblePointsQty = 0;
let cutoffIndex = 0;
let animationFrameId = null;

function animate() {
    if (!rootNode) {
        return;
    }

    animationFrameId = requestAnimationFrame(animate);

    viewer.timer.update();
    const delta = viewer.timer.getDelta();

    if (activeTrajectory && activeTrajectory.isActive) {
        activeTrajectory.update(delta);
    }

    telemetry.pollGpuTimers();

    frameCount++;
    frameCountForFps++;

    if (viewer.showNodes) {
        previousVisibleQueue.forEach(element => {
            element.node.helper.visible = false;
        })
    }

    visibleQueue = octreeTraverser.evaluate(
        rootNode,
        viewer.camera,
        window.innerHeight,
        frameCount
    );

    visibleQueue.sort((a, b) => (b.projectedSize ?? 0) - (a.projectedSize ?? 0));

    visiblePointsQty = 0;
    cutoffIndex = 0;

    for (let i = 0; i < visibleQueue.length; i++) {
        visiblePointsQty += visibleQueue[i].node.numPoints;
        if (visiblePointsQty > Config.POINT_BUDGET) {
            break;
        }
        cutoffIndex++;
    }

    visibleQueue.length = cutoffIndex;

    binFetcher.processFetchQueue(visibleQueue);

    cacheManager.sweep(frameCount);

    if (viewer.showNodes) {
        visibleQueue.forEach(element => {
            element.node.helper.visible = true;
        })

        previousVisibleQueue = visibleQueue;
    }

    frameCountForFps = telemetry.updateFps(frameCountForFps);

    if (frameCountForFps === 0) {
        telemetry.update(
            visibleQueue.length,
            binFetcher.activeFetches.size,
            cacheManager.loadedNodes.size,
            visiblePointsQty,
            viewer.showNodes,
            binFetcher.enableFetching
        );
    }

    const timerContext = telemetry.beginGpuTimer(visiblePointsQty);

    viewer.update(delta);

    telemetry.endGpuTimer(timerContext);
}

async function init(datasetFolder, runBenchmark = false) {
    activeTrajectory = null;

    if (runBenchmark) {
        console.log("[Main] Cloud com trajetória customizada");
    }

    Config.setServerUrl(datasetFolder);

    rootNode = await octreeLoader.load();

    if (!rootNode) {
        console.error("[Main] Não é possível iniciar. Octree não carregada.");
        return;
    }

    console.log("[Main] Iniciando aplicação...");
    binFetcher.updateMaterial();

    const customSettings = applyCloudSettings(datasetFolder, viewer, binFetcher);

    if (!customSettings) {
        viewer.adjustCamera(rootNode.boundingBox);
    }

    if (runBenchmark && customSettings?.trajectory) {
        activeTrajectory = new Trajectory(
            viewer.controls,
            telemetry,
            customSettings.trajectory,
            customSettings.speedMultiplier,
            3.0
        );
    }

    viewer.timer.reset();
    animate();
}

function clearScene() {
    console.log("[Main] Fechando aplicação...");

    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (activeTrajectory) {
        activeTrajectory.abort();
        activeTrajectory = null;
    }

    rootNode = null;
    previousVisibleQueue = [];
    visibleQueue = [];
    frameCount = 0;
    visiblePointsQty = 0;
    cutoffIndex = 0;
    frameCountForFps = 0;

    binFetcher.abortAll();
    cacheManager.swipeAll();
    inputHandler.setDefault();
    telemetry.setDefault();
    viewer.setDefault();
}

window.init = init;
window.clearScene = clearScene;