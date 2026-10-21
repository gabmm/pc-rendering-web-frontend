export const Config = {
    SERVER_URL: '',
    SERVER_BASE_URL: 'https://pc-rendering-server.duckdns.org/datasets/',
    //SERVER_BASE_URL: 'http://localhost:8080/datasets/',
    PING_FILE: 'ping.txt',
    PING_INTERVAL: 2000,
    POINT_BUDGET: 1000000, // máximo de pontos na tela
    MAX_CONCURRENT_FETCHES: 5, // Limite de concorrência de rede 
    MIN_NODE_PIXEL_SIZE: 30, // Limite do projectedSize
    MAX_AGE_FRAMES: 120,
    HAS_COLOR: false,
    CLOUD_NAME: '',
    POINT_SIZE: 0.1,

    setHasColor(value) {
        this.HAS_COLOR = value;
        console.log(`[Config] HAS_COLOR alterado para: ${value}`);
    },

    setPointBudget(value) {
        this.POINT_BUDGET = value;
        console.log(`[Config] Point Budget alterado para: ${value}`);
    },

    setPointSize(value) {
        this.POINT_SIZE = value;
        console.log(`[Config] Point Size alterado para: ${value}`);
    },

    setServerUrl(value) {
        this.SERVER_URL = this.SERVER_BASE_URL + value;
        this.CLOUD_NAME = value;
        console.log(`[Config] URL do servidor alterada para: ${this.SERVER_URL}`);
    }
};

export const BOUNDING_BOX_COLORS = [
    0x00FF00, // Nível 0: Verde (Raiz)
    0xFF0000, // Nível 1: Vermelho
    0x0000FF, // Nível 2: Azul
    0xFFFF00, // Nível 3: Amarelo
    0xFF00FF, // Nível 4: Magenta / Rosa Choque
    0x00FFFF, // Nível 5: Ciano / Azul Claro
    0xFF8C00, // Nível 6: Laranja
    0xFFFFFF  // Nível 7: Branco
];

export const NODE_STATUS = Object.freeze({
    UNLOADED: 0,
    LOADING: 1,
    LOADED: 2
});