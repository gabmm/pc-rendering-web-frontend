import { Config } from '../Constants.js';

export class InputHandler {
    constructor(viewer, cacheManager, binFetcher) {
        this.INITIAL_POINT_BUDGET = Config.POINT_BUDGET;
        this.viewer = viewer;
        this.cacheManager = cacheManager;
        this.binFetcher = binFetcher;
        this.isTopologyVisible = true;
        this.budgetSlider = document.getElementById('budgetSlider');
        this.budgetValueDisplay = document.getElementById('budgetValueDisplay');
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

        if (this.budgetSlider && this.budgetValueDisplay) {
            this.budgetSlider.addEventListener('input', (event) => {
                const newBudget = parseInt(event.target.value, 10);
                this.budgetValueDisplay.innerText = (newBudget / 1000000).toFixed(1) + ' M';
                Config.setPointBudget(newBudget);
            });
        } else {
            console.warn("[InputHandler] Elementos do Slider não encontrados no DOM.");
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
    }
}