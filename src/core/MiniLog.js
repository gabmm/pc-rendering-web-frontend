import { Config } from "../Constants.js";

export class MiniLog {
    constructor() {
        this.container = document.getElementById('miniLog');
        this.container.style.color = '#00FF00';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '14px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.padding = '15px';
        this.container.style.borderRadius = '5px';
        this.container.style.pointerEvents = 'auto';
        const logUI = this.generatePointBudgetSlider();

        this.statusDiv = document.getElementById('log-content');

        this.container.insertAdjacentHTML('afterbegin', logUI);
        this.container.insertBefore(this.statusDiv, this.container.lastElementChild);
        this.now = performance.now();
        this.lastFpsTime = performance.now();
        this.currentFps = 0;

        this.currentPing = 0;
        this._initPingCounter(Config.SERVER_BASE_URL + Config.PING_FILE);
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
        `;
    }

    updateFps(frameThisSecond) {
        this.now = performance.now();

        if (this.now - this.lastFpsTime >= 1000) {
            this.currentFps = frameThisSecond;
            this.lastFpsTime = this.now;
            return 0;
        }

        return frameThisSecond;
    }

    setDefault() {
        this.now = performance.now();
        this.lastFpsTime = performance.now();
        this.currentFps = 0;
    }

    _initPingCounter(url) {
        setInterval(async () => {
            const startTime = performance.now();
            try {
                await fetch(url, { cache: 'no-store' });
                this.currentPing = Math.round(performance.now() - startTime);
            } catch (e) {
                this.currentPing = 'ERROR';
            }

        }, Config.PING_INTERVAL);
    }
}