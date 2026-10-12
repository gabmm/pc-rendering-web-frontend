import { Viewer } from './core/Viewer.js';
import { InputHandler } from './core/InputHandler.js';
import { OctreeLoader } from './loaders/OctreeLoader.js';
import { BinFetcher } from './loaders/BinFetcher.js';
import { OctreeTraverser } from './core/OctreeTraverser.js';
import { CacheManager } from './core/CacheManager.js';
import { Telemetry } from './core/Telemetry.js';
import { Config } from './Constants.js';
import { buildDatasetTableUI, applyCloudSettings } from './CloudDefaultSettings.js';

const viewer = new Viewer();
const telemetry = new Telemetry(viewer.renderer);
const octreeLoader = new OctreeLoader(viewer);
const octreeTraverser = new OctreeTraverser();
const cacheManager = new CacheManager(viewer);
const binFetcher = new BinFetcher(viewer, cacheManager);
const inputHandler = new InputHandler(viewer, cacheManager, binFetcher, telemetry);
buildDatasetTableUI();

let rootNode = null;
let previousVisibleQueue = [];
let visibleQueue = [];
let frameCount = 0;
let frameCountForFps = 0;
let visiblePointsQty = 0;
let cutoffIndex = 0;

function animate() {
    if (!rootNode) {
        return;
    }

    requestAnimationFrame(animate);

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

    telemetry.update(
        visibleQueue.length,
        binFetcher.activeFetches.size,
        cacheManager.loadedNodes.size,
        visiblePointsQty,
        viewer.showNodes,
        binFetcher.enableFetching
    );

    const timerContext = telemetry.beginGpuTimer(visiblePointsQty);

    viewer.update();

    telemetry.endGpuTimer(timerContext);
}

async function init(datasetFolder) {
    Config.setServerUrl(datasetFolder);

    rootNode = await octreeLoader.load();

    if (!rootNode) {
        console.error("[Main] Não é possível iniciar. Octree não carregada.");
    } else {
        console.log("[Main] Iniciando aplicação...");
        binFetcher.updateMaterial();

        const hasCustomSettings = applyCloudSettings(datasetFolder, viewer, binFetcher);

        if (!hasCustomSettings) {
            viewer.adjustCamera(rootNode.boundingBox);
        }


    }

    animate();
}

function clearScene() {
    console.log("[Main] Fechando aplicação...");

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