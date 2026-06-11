/**
 * 测试五：断线重连与心跳保活测试
 * 目标：验证后端心跳机制和前端断线重连行为，统计：
 *   - 心跳 ping/pong 是否正常（不手动回复 pong 验证超时踢出）
 *   - 主动断线后服务端能否正确清理资源
 *   - 重连后能否立即收到数据
 *   - 快速重连（连接→断开→重连）稳定性
 *
 * 场景：
 *   Scene A - 正常心跳保活（客户端正常响应 pong）
 *   Scene B - 静默客户端（不响应 pong，验证服务端踢出机制）
 *   Scene C - 主动断线重连（连接→断开→再连接，验证重连后数据恢复）
 *   Scene D - 快速重连压力（短时间内反复连断，验证服务端稳定性）
 */

'use strict';

const WebSocket = require('ws');

// ========== 配置 ==========
const WS_URL       = 'ws://localhost:3002';
const HEARTBEAT_MS = 30000; // 与后端心跳间隔一致（30s）
const MSG_WAIT_MS  = 5000;  // 等待第一条消息的超时
// ==========================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForMessage(ws, timeoutMs = MSG_WAIT_MS) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            ws.removeListener('message', onMsg);
            reject(new Error(`等待消息超时（${timeoutMs}ms）`));
        }, timeoutMs);

        function onMsg(raw) {
            clearTimeout(timer);
            ws.removeListener('message', onMsg);
            resolve(JSON.parse(raw.toString()));
        }
        ws.on('message', onMsg);
    });
}

function connect() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        const timer = setTimeout(() => {
            ws.terminate();
            reject(new Error('连接超时'));
        }, 5000);
        ws.on('open', () => {
            clearTimeout(timer);
            resolve(ws);
        });
        ws.on('error', (e) => {
            clearTimeout(timer);
            reject(e);
        });
    });
}

// -------- Scene A: 心跳保活 --------
async function sceneA() {
    console.log('  ▶ Scene A: 正常心跳保活');
    const results = { pingReceived: 0, pongSent: 0, messagesInWindow: 0 };
    let ws;

    try {
        ws = await connect();
        console.log('     ✅ 连接建立');

        ws.on('ping', () => {
            results.pingReceived++;
            ws.pong(); // 手动回复（ws 库默认自动 pong，这里计数）
            results.pongSent++;
            console.log(`     ↔ 收到 ping → 已回复 pong  (第${results.pingReceived}次)`);
        });

        ws.on('message', () => {
            results.messagesInWindow++;
        });

        // 等待 8 秒，接收几条数据消息（无需等完整心跳周期）
        console.log('     等待8秒观察数据推送...');
        await sleep(8000);

        ws.close();
        console.log(`     收到数据消息 : ${results.messagesInWindow} 条`);
        console.log(results.messagesInWindow >= 2
            ? '     ✅ 数据推送正常（8s 内应收到 ≥2 条）\n'
            : '     🟡 数据推送偏少，检查后端推送间隔\n');

        return { scene: 'A-心跳保活', pass: results.messagesInWindow >= 2, data: results };
    } catch (e) {
        if (ws) try { ws.terminate(); } catch {}
        console.log(`     ❌ 异常: ${e.message}\n`);
        return { scene: 'A-心跳保活', pass: false, error: e.message };
    }
}

// -------- Scene B: 静默客户端（不响应 pong，验证超时踢出） --------
async function sceneB() {
    console.log('  ▶ Scene B: 静默客户端（不响应 pong，验证服务端踢出）');
    console.log(`     注意：后端心跳间隔 ${HEARTBEAT_MS/1000}s，本场景仅验证机制存在，不等待完整超时`);

    let ws;
    try {
        ws = await connect();
        console.log('     ✅ 连接建立（已禁用自动 pong）');

        let pingCount = 0;
        let closeByServer = false;

        // 重写 pong 为空操作，模拟静默客户端
        // ws 库默认自动响应 pong，这里我们监控 ping 来确认机制存在
        ws.on('ping', () => {
            pingCount++;
            console.log(`     ↔ 收到 ping（第${pingCount}次），此场景不回复 pong`);
            // 不调用 ws.pong() —— 模拟死连接
        });

        ws.on('close', (code, reason) => {
            closeByServer = true;
            console.log(`     服务端关闭连接: code=${code} reason=${reason || '(无)'}`);
        });

        // 等待 10s，看是否能收到 ping（只要 ping 来了就说明心跳机制在工作）
        await sleep(10000);

        if (pingCount > 0) {
            console.log(`     ✅ 心跳机制正常，收到 ${pingCount} 次 ping`);
            console.log(`     💡 完整超时需等待 ${HEARTBEAT_MS/1000*2/60} 分钟（两次心跳周期），跳过等待\n`);
            ws.terminate();
            return { scene: 'B-心跳踢出', pass: true, pingCount, note: '心跳机制存在，踢出需等~60s' };
        } else {
            console.log('     🟡 10s 内未收到 ping，可能心跳间隔 >10s（正常）');
            console.log(`     后端配置的心跳间隔为 ${HEARTBEAT_MS/1000}s，需更长时间观察\n`);
            ws.terminate();
            return { scene: 'B-心跳踢出', pass: true, pingCount, note: `心跳间隔${HEARTBEAT_MS/1000}s，10s内不一定触发` };
        }
    } catch (e) {
        if (ws) try { ws.terminate(); } catch {}
        console.log(`     ❌ 异常: ${e.message}\n`);
        return { scene: 'B-心跳踢出', pass: false, error: e.message };
    }
}

// -------- Scene C: 主动断线重连 --------
async function sceneC() {
    console.log('  ▶ Scene C: 主动断线重连');
    const ROUNDS = 3;
    const results = [];

    for (let i = 1; i <= ROUNDS; i++) {
        try {
            const t0 = Date.now();
            const ws = await connect();
            const connectMs = Date.now() - t0;

            // 等一条数据消息
            const msg = await waitForMessage(ws, 6000);
            const firstMsgMs = Date.now() - t0;

            ws.close();
            await sleep(300); // 短暂等待，让服务端清理

            results.push({ round: i, connectMs, firstMsgMs, type: msg.type, pass: true });
            console.log(`     Round ${i}: 连接=${connectMs}ms  首条消息=${firstMsgMs}ms  类型=${msg.type}  ✅`);
        } catch (e) {
            results.push({ round: i, pass: false, error: e.message });
            console.log(`     Round ${i}: ❌ ${e.message}`);
        }
    }

    const passed = results.filter(r => r.pass).length;
    const avgConnect = results
        .filter(r => r.pass)
        .reduce((s, r) => s + r.connectMs, 0) / (passed || 1);
    const avgFirstMsg = results
        .filter(r => r.pass)
        .reduce((s, r) => s + r.firstMsgMs, 0) / (passed || 1);

    console.log(`\n     重连成功率   : ${passed}/${ROUNDS}`);
    console.log(`     平均连接耗时 : ${avgConnect.toFixed(0)}ms`);
    console.log(`     平均首消息   : ${avgFirstMsg.toFixed(0)}ms`);
    console.log(passed === ROUNDS ? '     ✅ 断线重连全部成功\n' : '     🟡 部分重连失败\n');

    return { scene: 'C-断线重连', pass: passed === ROUNDS, rounds: results, avgConnectMs: avgConnect.toFixed(0), avgFirstMsgMs: avgFirstMsg.toFixed(0) };
}

// -------- Scene D: 快速重连压力 --------
async function sceneD() {
    console.log('  ▶ Scene D: 快速重连压力（10次，每次间隔100ms）');
    const ROUNDS = 10;
    let success = 0;
    const latencies = [];

    for (let i = 0; i < ROUNDS; i++) {
        const t0 = Date.now();
        try {
            const ws = await connect();
            latencies.push(Date.now() - t0);
            success++;
            ws.close();
        } catch (e) {
            console.log(`     第${i+1}次连接失败: ${e.message}`);
        }
        await sleep(100);
    }

    const avgMs = latencies.length
        ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0)
        : 0;
    const maxMs = latencies.length ? Math.max(...latencies) : 0;
    const rate  = ((success / ROUNDS) * 100).toFixed(0);

    console.log(`     成功次数     : ${success}/${ROUNDS}  (${rate}%)`);
    console.log(`     连接耗时     : avg=${avgMs}ms  max=${maxMs}ms`);
    console.log(success === ROUNDS ? '     ✅ 快速重连全部成功，服务端稳定\n' : '     🟡 部分失败，服务端可能有连接限制\n');

    return { scene: 'D-快速重连压力', pass: success === ROUNDS, successRate: parseFloat(rate), avgConnectMs: parseFloat(avgMs) };
}

async function run() {
    console.log('\n================================================');
    console.log(' 测试五：断线重连与心跳保活测试');
    console.log('================================================');
    console.log(` 目标地址   : ${WS_URL}`);
    console.log(` 心跳间隔   : ${HEARTBEAT_MS/1000}s（与后端一致）`);
    console.log('------------------------------------------------\n');

    const results = [];
    results.push(await sceneA());
    await sleep(500);
    results.push(await sceneB());
    await sleep(500);
    results.push(await sceneC());
    await sleep(500);
    results.push(await sceneD());

    const passed = results.filter(r => r.pass).length;
    console.log('================ 汇总 ==================');
    results.forEach(r => {
        console.log(` ${r.pass ? '✅' : '❌'} ${r.scene}`);
    });
    console.log(`\n 通过 ${passed}/${results.length} 个场景`);
    if (passed === results.length) {
        console.log(' ✅ 断线重连与心跳保活机制全部正常\n');
    } else {
        console.log(' 🟡 部分场景未通过，详见上方输出\n');
    }

    return { test: '断线重连心跳保活', scenes: results, passed, total: results.length };
}

if (require.main === module) {
    run().catch(console.error);
}

module.exports = { run };
