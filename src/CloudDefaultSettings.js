// CloudDefaultSettings.js

export const CloudSettings = {
    "amsterdam": {
        size: "34.61",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 48.21, y: 7.51, z: 520.17 },
        target: { x: 443.31, y: 636.88, z: -437.47 },
        pointSize: 0.420
    },
    "buddha": {
        size: "18.56",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: -0.97, y: 0.41, z: 3.57 },
        target: { x: 1.10, y: 1.76, z: 0.80 },
        pointSize: 0.001
    },
    "cephalotaxus-harringtonii-tree": {
        size: "0.51",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 0.07, y: 0.96, z: 0.44 },
        target: { x: 0.43, y: 0.23, z: -0.06 },
        pointSize: 0.001
    },
    "dinning-room": {
        size: "268.42",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 4.66, y: 1.07, z: 1.93 },
        target: { x: 3.96, y: 1.70, z: 1.76 },
        pointSize: 0.022
    },
    "dublin": {
        size: "1405.48",
        isRgb: "No",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 3463.95, y: 1026.44, z: 461.50 },
        target: { x: 1938.45, y: 1339.69, z: -278.85 },
        pointSize: 0.100
    },
    "garden": {
        size: "41.18",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 13.57, y: 0.03, z: 3.61 },
        target: { x: 8.58, y: 4.84, z: 0.26 },
        pointSize: 0.001
    },
    "hilltop": {
        size: "196.92",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 210.40, y: 532.10, z: 92.75 },
        target: { x: 229.94, y: 380.12, z: -4.72 },
        pointSize: 0.316
    },
    "monarch-of-the-swamp-tree": {
        size: "22.87",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 3.18, y: -16.42, z: 17.95 },
        target: { x: 13.87, y: 8.04, z: 10.22 },
        pointSize: 0.001
    },
    "petit-versailles": {
        size: "198.29",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 260.93, y: 167.41, z: 60.08 },
        target: { x: 156.52, y: 346.51, z: -16.16 },
        pointSize: 0.329
    },
    "pisa": {
        size: "185.40",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 83.88, y: 235.70, z: 54.79 },
        target: { x: 188.01, y: 280.23, z: 41.26 },
        pointSize: 0.219
    },
    "rosedown": {
        size: "1448.38",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 399.65, y: 218.92, z: 44.31 },
        target: { x: 335.78, y: 217.19, z: 16.06 },
        pointSize: 0.018
    },
    "san-gabriel-mountain": {
        size: "234.92",
        isRgb: "No",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 304.30, y: 332.21, z: 310.95 },
        target: { x: 2668.92, y: 931.94, z: -763.72 },
        pointSize: 0.100
    },
    "unnamed": {
        size: "381.68",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 90.60, y: 42.83, z: 31.01 },
        target: { x: 68.94, y: 67.31, z: 10.84 },
        pointSize: 0.020
    },
    "vulcan-mountain": {
        size: "156.70",
        isRgb: "Yes",
        description: "N/A",
        sourceLabel: "N/A",
        sourceLink: "N/A",

        position: { x: 345.67, y: 1.10, z: 121.59 },
        target: { x: 234.59, y: 105.82, z: 19.64 },
        pointSize: 0.144
    }
};

export function buildDatasetTableUI() {
    const tbody = document.getElementById('dataset-table-body');
    if (!tbody) return;

    let html = '';

    for (const [cloudName, data] of Object.entries(CloudSettings)) {
        html += `
        <tr style="border-bottom: 1px solid #333;">
            <td style="padding: 10px; font-weight: bold;">${cloudName}</td>
            <td style="padding: 10px; white-space: nowrap;">${data.size ? data.size + ' M' : '--'}</td>
            <td style="padding: 10px; white-space: nowrap;">${data.isRgb}</td>
            <td style="padding: 10px; color: #aaa; font-size: 12px; max-width: 250px;">${data.description || 'Sem descrição'}</td>
            <td style="padding: 10px;">
                <a href="${data.sourceLink || '#'}" target="_blank" style="color: #4CAF50; text-decoration: none;">
                    [${data.sourceLabel || 'Link'}]
                </a>
            </td>
            <td style="padding: 10px;">
                <button onclick="window.loadDataset('${cloudName}')" style="cursor: pointer; padding: 5px 10px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                    Load Cloud
                </button>
            </td>
        </tr>
        `;
    }

    tbody.innerHTML = html;
}

export function applyCloudSettings(datasetName, viewer, binFetcher) {
    const settings = CloudSettings[datasetName];

    if (!settings) return false;

    if (binFetcher && binFetcher.pointMaterial) {
        binFetcher.pointMaterial.size = settings.pointSize;
        binFetcher.pointMaterial.needsUpdate = true;

        const sizeSlider = document.getElementById('sizeSlider');
        const sizeValueDisplay = document.getElementById('sizeValueDisplay');
        if (sizeSlider && sizeValueDisplay) {
            sizeSlider.value = settings.pointSize;
            sizeValueDisplay.innerText = settings.pointSize.toFixed(3);
        }
    }

    viewer.controls.setLookAt(
        settings.position.x, settings.position.y, settings.position.z,
        settings.target.x, settings.target.y, settings.target.z,
        false
    );

    return true;
}

