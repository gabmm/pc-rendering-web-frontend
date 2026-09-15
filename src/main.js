import { Viewer } from './core/Viewer.js';
import { InputHandler } from './core/InputHandler.js';
import { OctreeLoader } from './loaders/OctreeLoader.js';
import { BinFetcher } from './loaders/BinFetcher.js';
import { OctreeTraverser } from './core/OctreeTraverser.js';
import { CacheManager } from './core/CacheManager.js';
import { MiniLog } from './core/MiniLog.js';
import { Config } from './Constants.js';

const viewer = new Viewer();
const miniLog = new MiniLog();
const octreeLoader = new OctreeLoader(viewer);
const octreeTraverser = new OctreeTraverser();
const cacheManager = new CacheManager(viewer);
const binFetcher = new BinFetcher(viewer, cacheManager);
const inputHandler = new InputHandler(viewer, cacheManager, binFetcher);

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

    frameCountForFps = miniLog.updateFps(frameCountForFps);

    miniLog.update(
        visibleQueue.length,
        binFetcher.activeFetches.size,
        cacheManager.loadedNodes.size,
        visiblePointsQty,
        viewer.showNodes,
        binFetcher.enableFetching
    );


    viewer.update();
}

async function init(datasetFolder) {
    Config.setServerUrl(datasetFolder);

    rootNode = await octreeLoader.load();

    if (!rootNode) {
        console.error("[Main] Não é possível iniciar. Octree não carregada.");
    } else {
        console.log("[Main] Iniciando aplicação...");
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
    viewer.clearHelpers();
    viewer.setDefault();
    inputHandler.setDefault();
    miniLog.setDefault();
    viewer.update();
}

window.init = init;
window.clearScene = clearScene;