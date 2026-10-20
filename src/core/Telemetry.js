import { Config } from "../Constants.js";

export class Telemetry {
    constructor(renderer) {
        this.trajectoryConfig = null;

        this.container = document.getElementById('miniLog');
        this.container.style.color = '#00FF00';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '14px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.padding = '15px';
        this.container.style.borderRadius = '5px';
        this.container.style.pointerEvents = 'auto';
        const budgetUI = this.generatePointBudgetSlider();
        const sizeUI = this.generatePointSizeSlider();
        this.statusDiv = document.getElementById('log-content');

        if (!this.statusDiv) {
            this.statusDiv = document.createElement('div');
            this.statusDiv.id = 'log-content'
        }

        this.container.insertAdjacentHTML('afterbegin', budgetUI);
        this.container.insertAdjacentHTML('afterbegin', sizeUI);
        this.container.insertBefore(this.statusDiv, this.container.lastElementChild);

        //fps
        this.now = performance.now();
        this.lastFpsTime = performance.now();
        this.currentFps = 0;

        //ping
        this.currentPing = 0;
        this._initPingCounter();

        //draw call times
        this.isRecording = false;
        this.frameLog = [];
        this.pendingQueries = [];
        this.currentFrameId = 0;
        this.lastFrameTime = performance.now();

        this.gl = renderer.getContext();
        this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2') || this.gl.getExtension('EXT_disjoint_timer_query');

        if (this.ext) {
            console.log('[Telemetria] Extensão de temporizador de GPU carregada com sucesso');
        } else {
            console.error('[Telemetry] Não foi possível carregar extensão de temporizador de GPU')
        }
    }

    generatePointBudgetSlider() {
        return `
            <div class="minilog-control" style="margin-bottom: 12px; border-bottom: 1px dashed #00FF00; padding-bottom: 12px;">
                <label for="budgetSlider">Point Budget: <span id="budgetValueDisplay">5.0 M</span></label><br>
                <input 
                    type="range" 
                    id="budgetSlider" 
                    min="100000"       
                    max="20000000"     
                    step="100000"      
                    value="5000000"
                    style="width: 100%; margin-top: 5px;"
                >
            </div>
        `;
    }

    generatePointSizeSlider() {
        return `
            <div class="minilog-control" style="margin-bottom: 12px; border-bottom: 1px dashed #00FF00; padding-bottom: 12px;">
                <label for="sizeSlider">Point Size: <span id="sizeValueDisplay">0.1</span></label><br>
                <input 
                    type="range" 
                    id="sizeSlider" 
                    min="0.001"       
                    max="1.000"     
                    step="0.001"      
                    value="0.100"
                    style="width: 100%; margin-top: 5px;"
                >
            </div>
        `;
    }

    update(visibleNodes, activeFetches, cachedNodes, visiblePoints, showNodes, enableFetching) {
        this.statusDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">STATUS</div>
            <div>FPS                     : ${this.currentFps}</div>
            <div>Ping                    : ${this.currentPing} ms</div>
            <div>Nós Visíveis            : ${visibleNodes}</div>
            <div>Pontos Visíveis         : ${visiblePoints}</div>
            <div>Downloads Pendentes     : ${activeFetches} / 5</div>
            <div>Cache                   : ${cachedNodes}</div>
            <div>Mostrar nós? [n]        : ${showNodes ? 'yes' : 'no'}</div>
            <div>Habilitar download? [p] : ${enableFetching ? 'yes' : 'no'}</div>
            <div>Limpar nós [l]</div>
            <div>Capturando dados? [r]   : ${this.isRecording ? 'yes' : 'no'}</div>
        `;
    }

    updateFps(framesThisSecond) {
        this.now = performance.now();

        if (this.now - this.lastFpsTime >= 1000) {
            this.currentFps = framesThisSecond;
            this.lastFpsTime = this.now;
            return 0;
        }

        return framesThisSecond;
    }

    setDefault() {
        this.now = performance.now();
        this.lastFpsTime = performance.now();
        this.currentFps = 0;
        this.isRecording = false;

        this.frameLog = [];
        this.currentFrameId = 0;

        if (this.ext && this.pendingQueries.length > 0) {
            for (const item of this.pendingQueries) {
                this.gl.deleteQuery(item.query);
            }
        }

        this.pendingQueries = [];
    }

    _initPingCounter() {
        setInterval(async () => {
            const startTime = performance.now();
            try {
                await fetch(Config.SERVER_URL + '/octree.json', { method: 'HEAD', cache: 'no-store' });
                this.currentPing = Math.round(performance.now() - startTime);
            } catch (e) {
                this.currentPing = 'ERROR';
            }

        }, Config.PING_INTERVAL);
    }

    startRecording() {
        this.isRecording = true;
        this.frameLog = [];
        this.pendingQueries = [];
        this.currentFrameId = 0;
        this.lastFrameTime = performance.now();
        console.log('[Telemetria] Iniciando captura de dados...');
    }

    stopRecording() {
        this.isRecording = false;
        this.frameLog.push({ ...Config, ...this.trajectoryConfig });
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.frameLog, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        const formatDate = (date) => date.toISOString().replace('T', '_').replace(/:/g, '-').slice(0, 19);
        const fileName = `rendering_telemetry_${Config.CLOUD_NAME}_${formatDate(new Date())}.json`;
        downloadAnchorNode.setAttribute('download', fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        console.log(`[Telemetria] Captura de dados interrompida. Gerado aquivo ${fileName}`);
    }

    beginGpuTimer(visiblePointsQty) {
        if (!this.isRecording) return null;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        const memoryMb = performance.memory ? (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) : 0;

        const frameData = {
            frameId: this.currentFrameId++,
            timestampMs: now,
            deltaTimeMs: deltaTime,
            jsHeapMb: parseFloat(memoryMb),
            visiblePointsQty,
            gpuDrawMs: 0
        }

        this.frameLog.push(frameData);

        let query = null;
        if (this.ext) {
            query = this.gl.createQuery();
            this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query);
        }

        return { query, frameData };
    }

    endGpuTimer(timerContext) {
        if (!this.isRecording || !timerContext?.query || !this.ext) return;

        this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);

        this.pendingQueries.push({
            query: timerContext.query,
            frameRef: timerContext.frameData
        });
    }

    pollGpuTimers() {
        if (!this.ext || !this.pendingQueries.length) return;

        let i = 0;
        while (i < this.pendingQueries.length) {
            const { query, frameRef } = this.pendingQueries[i];
            const isAvailable = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE);

            if (isAvailable) {
                const timeElapsedMs = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT) / 1000000.0;
                frameRef.gpuDrawMs = timeElapsedMs;
                this.gl.deleteQuery(query);
                this.pendingQueries.splice(i, 1);
            } else {
                break; //se a mais antiga não está pronta, as demais também não
            }
        }
    }

    setTrajectoryConfig(segDuration, totalDuration, keyframes, speedMultiplier, warmupDuration) {
        this.trajectoryConfig = {
            KEY_FRAMES: keyframes,
            SEGMENT_DURATIONS: segDuration,
            SPEED_MULTIPLIER: speedMultiplier,
            TOTAL_ESTIMATED_DURATION: totalDuration,
            WARM_UP_DURATION: warmupDuration
        }

        console.log(`[Telemetry] Configurações de trajetória recebidas`, this.trajectoryConfig)
    }
}