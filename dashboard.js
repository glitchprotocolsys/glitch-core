const blessed = require('blessed');
const contrib = require('blessed-contrib');
const fs = require('fs');

const screen = blessed.screen({
    smartCSR: true,
    title: 'GLITCH MISSION CONTROL SYSTEM // SECURITY TERMINAL'
});

let grid = new contrib.grid({rows: 12, cols: 12, screen: screen});
let viewMode = 'MAIN';

let telemetryBox, chartBox, socialBox, intelBox, engineBox, ledgerBox, simWindow;

function setupMainLayout() {
    screen.children.forEach(c => screen.remove(c));
    
    telemetryBox = grid.set(0, 0, 4, 4, blessed.box, {
        label: ' TOKEN TELEMETRY ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'red' }, label: { fg: 'red', bold: true } }
    });

    chartBox = grid.set(0, 4, 4, 4, blessed.box, {
        label: ' PRICE ACTION VECTOR ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'red' }, label: { fg: 'red', bold: true } }
    });

    socialBox = grid.set(0, 8, 4, 4, blessed.box, {
        label: ' NETWORK GROWTH DENSITY ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'red' }, label: { fg: 'red', bold: true } }
    });

    intelBox = grid.set(4, 0, 4, 4, blessed.box, {
        label: ' COUNTER-INTEL MATRIX ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'red' }, label: { fg: 'red', bold: true } }
    });

    engineBox = grid.set(8, 0, 4, 4, blessed.box, {
        label: ' ACCUMULATION ACCELERATOR ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'red' }, label: { fg: 'red', bold: true } }
    });

    ledgerBox = grid.set(4, 4, 8, 8, blessed.box, {
        label: ' NETWORK TRANSACTION LEDGER REAL-TIME STREAM ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'red' }, label: { fg: 'red', bold: true } }
    });
}

function setupSimLayout() {
    screen.children.forEach(c => screen.remove(c));
    simWindow = grid.set(2, 2, 8, 8, blessed.box, {
        label: ' DEFLATIONARY CROSSOVER MODELLING UNIT ', tags: true, border: { type: 'line' },
        style: { border: { fg: 'yellow' }, label: { fg: 'yellow', bold: true } }
    });
}

function drawAsciiChart(history) {
    const height = 6; const width = 20;
    let gridSpace = Array(height).fill(0).map(() => Array(width).fill(' '));
    const minVal = Math.min(...history); const maxVal = Math.max(...history);
    const range = (maxVal - minVal) || 1;

    for (let i = 0; i < history.length && i < width; i++) {
        const val = history[i];
        const row = height - 1 - Math.floor(((val - minVal) / range) * (height - 1));
        gridSpace[row][i] = '■';
    }
    return gridSpace.map(rowLine => '  ' + rowLine.join('')).join('\n');
}

function refreshSystemView() {
    try {
        if (!fs.existsSync('metrics.json')) return;
        const data = JSON.parse(fs.readFileSync('metrics.json'));

        if (viewMode === 'MAIN') {
            let telText = `\n  {bold}PRICE:{/bold}     $${data.price.toFixed(6)}\n  {bold}24H VOL:{/bold}   $${data.volume_24h.toFixed(2)}\n  -----------------------\n  {bold}CIRCULATION INITIAL:{/bold}\n  ${data.total_supply.toLocaleString()}`;
            telemetryBox.setContent(telText);

            if (data.price_history) chartBox.setContent(`\n` + drawAsciiChart(data.price_history) + `\n\n   Matrix Trend Vector`);

            let socialText = `\n  {bold}PORTAL MEMS:{/bold}  ${data.portal_count}\n  {bold}JOIN VELOC:{/bold}   +${data.portal_velocity} / hr\n  {bold}X MENTIONS:{/bold}   ${data.x_mentions_24h}\n  -----------------------\n  {bold}HOTKEYS:{/bold}     [S] Sim Panel  [Q] Exit`;
            socialBox.setContent(socialText);

            let intelText = `\n  {bold}CORE 100 POOL:{/bold} ${data.top_nodes_holding}%\n  {bold}MINT VECTOR:{/bold}   LOCKED\n`;
            const riskColor = data.sniper_risk_score > 0.4 ? 'red-fg' : 'green-fg';
            intelText += `  {bold}SNIPER RISK:{/bold}  {${riskColor}}${(data.sniper_risk_score * 100).toFixed(0)}%{/${riskColor}}\n  -----------------------\n  {bold}OP STATUS:{/bold}    SATOSHI_READY`;
            intelBox.setContent(intelText);

            let engineText = `\n  {bold}CORE FURNACE BURN:{/bold}\n  ${data.burned.toLocaleString()} $GLITCH\n\n  {bold}TREASURY RESERVES:{/bold}\n  ${data.treasury_sol.toFixed(4)} SOL`;
            engineBox.setContent(engineText);

            let ledgerText = `\n`;
            if (data.alerts && data.alerts.length > 0) ledgerText += `  {yellow-fg}{blink}${data.alerts[0]}{/blink}{/yellow-fg}\n  ===============================================================\n`;
            ledgerText += `  ` + data.recent_txs.join('\n  ');
            ledgerBox.setContent(ledgerText);
        } else if (viewMode === 'SIM') {
            let simText = `\n`;
            simText += `  {yellow-fg}{bold}PERPETUAL HEARTBEAT CRITICAL PROFILE PROFILE MATRIX (PRE-LAUNCH){/bold}{/yellow-fg}\n`;
            simText += `  ===============================================================\n\n`;
            simText += `  {bold}SIMULATED VOLUME STABLE VECTOR:{/bold}   $1,500,000.00 USD / daily\n`;
            simText += `  {bold}NATIVE INTERCEPT TAX VECTOR:{/bold}      0.80% Furnace Allocation\n\n`;
            simText += `  {bold}PROJECTION MATRIX RESULTS (365 HORIZON):{/bold}\n`;
            simText += `  ---------------------------------------------------------------\n`;
            simText += `  - TOTAL SOL FLOW CAPTURED:            24,333.33 SOL\n`;
            simText += `  - VELOCITY REVENUE PIPELINE:          66.6667 SOL / day\n`;
            simText += `  - SPECULATIVE SYSTEM REBUY SPEED:     1,703.33 SOL / year\n\n`;
            simText += `  {bold}HEARTBEAT DIAGNOSTIC CAPABILITY STATE:{/bold}\n`;
            simText += `  [ Day 196 ] -> {green-fg}★ CRITICAL CROSSOVER TRANSITION CONFIRMED{/green-fg}\n`;
            simText += `                 Sovereign engine is fully self-sustaining.\n\n`;
            simText += `  {bold}PRESS [M] TO RETURN TO TACTICAL DATA STREAM REAL-TIME LAYER{/bold}`;
            simWindow.setContent(simText);
        }
        screen.render();
    } catch (e) {}
}

screen.key(['s', 'S'], () => {
    viewMode = 'SIM';
    setupSimLayout();
    refreshSystemView();
});

screen.key(['m', 'M'], () => {
    viewMode = 'MAIN';
    setupMainLayout();
    refreshSystemView();
});

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

setupMainLayout();
setInterval(refreshSystemView, 350);
screen.render();
