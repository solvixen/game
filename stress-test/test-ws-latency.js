/**
 * WebSocket 消息延迟测试
 * 方法：后端推送消息时附带 serverTime，前端 onmessage 用 Date.now() 减去 serverTime
 * 目标：连续接收 100 条消息，统计端到端延迟
 */

'use strict';

const WebSocket = require('ws');

const WS_URL      = 'ws://localhost:3002';
const MSG_COUNT   = parseInt(process.argv[2]) || 100;  // 默认测 100 条
const WARMUP      = 5;   // 前 5 条不计入统计（预热）

const latencies = [];
let received = 0;
let done = false;

function pad(str, len) { return String(str).padStart(len); }

function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

function printReport() {
    const data = latencies.filter((_, i) => i >= WARMUP);
    if (data.length === 0) {
        console.log('❌ 未收到有效数据');
        return;
    }

    const min  = Math.min(...data);
    const max  = Math.max(...data);
    const avg  = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
    const p50  = percentile(data, 50);
    const p95  = percentile(data, 95);
    const p99  = percentile(data, 99);

    const allUnder150 = data.every(v => v < 150);

    console.log('\n========== WebSocket 消息延迟测试报告 ==========');
    console.log(`测试消息数: ${pad(data.length, 4)} 条（预热 ${WARMUP} 条已排除）`);
    console.log(`最小延迟:   ${pad(min, 6)} ms`);
    console.log(`最大延迟:   ${pad(max, 6)} ms`);
    console.log(`平均延迟:   ${pad(avg, 6)} ms`);
    console.log(`P50 延迟:   ${pad(p50, 6)} ms`);
    console.log(`P95 延迟:   ${pad(p95, 6)} ms`);
    console.log(`P99 延迟:   ${pad(p99, 6)} ms`);
    console.log('------------------------------------------------');
    console.log(`全部 < 150ms: ${allUnder150 ? '✅ 是' : '❌ 否'}（设计目标: < 200ms）`);
    console.log('================================================\n');
}

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log(`✅ 已连接 ${WS_URL}，准备接收 ${MSG_COUNT} 条消息...`);
});

ws.on('message', (raw) => {
    if (done) return;

    try {
        const data = JSON.parse(raw);
        if (data.type === 'gameData' && data.serverTime) {
            const latency = Date.now() - data.serverTime;
            latencies.push(latency);
            received++;

            if (received % 20 === 0) {
                process.stdout.write(`  已接收 ${pad(received, 3)} 条...\r`);
            }

            if (received >= MSG_COUNT) {
                done = true;
                ws.close();
                printReport();
                process.exit(0);
            }
        }
    } catch (e) {
        // ignore parse errors
    }
});

ws.on('error', (err) => {
    console.error('❌ WebSocket 错误:', err.message);
    process.exit(1);
});

ws.on('close', () => {
    if (!done) {
        console.log('\n⚠️ 连接提前关闭');
        printReport();
    }
});
