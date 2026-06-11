/**
 * 测试一：WebSocket 并发连接测试
 * 目标：模拟 N 个客户端同时建立 WS 连接，统计：
 *   - 连接成功率
 *   - 连接建立耗时（min/avg/max）
 *   - 服务端稳定性（是否有连接被拒）
 */

'use strict';

const WebSocket = require('ws');

// ========== 配置 ==========
const WS_URL    = 'ws://localhost:3002';
const TOTAL     = parseInt(process.argv[2]) || 200;   // 并发连接数（命令行: node test-1-ws-concurrent.js 300）
const HOLD_MS   = 8000;  // 保持连接多少毫秒后关闭
const TIMEOUT   = 5000;  // 单个连接超时阈值（ms）
// ==========================

const results = {
    success:  0,
    failed:   0,
    timeouts: 0,
    latencies: [],   // 每个连接建立耗时
    firstMsgLatencies: [], // 第一条消息到达延迟
};

function pad(str, len) {
    return String(str).padStart(len);
}

function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx];
}

function connectOne(id) {
    return new Promise((resolve) => {
        const t0 = Date.now();
        let connected = false;
        let firstMsgTime = null;

        const timer = setTimeout(() => {
            if (!connected) {
                results.timeouts++;
                results.failed++;
                ws.terminate();
                resolve({ id, status: 'timeout' });
            }
        }, TIMEOUT);

        let ws;
        try {
            ws = new WebSocket(WS_URL);
        } catch (e) {
            clearTimeout(timer);
            results.failed++;
            return resolve({ id, status: 'error', msg: e.message });
        }

        ws.on('open', () => {
            connected = true;
            clearTimeout(timer);
            const connectMs = Date.now() - t0;
            results.success++;
            results.latencies.push(connectMs);
        });

        ws.on('message', (raw) => {
            if (firstMsgTime === null) {
                firstMsgTime = Date.now() - t0;
                results.firstMsgLatencies.push(firstMsgTime);
            }
        });

        ws.on('error', (err) => {
            clearTimeout(timer);
            if (!connected) {
                results.failed++;
                resolve({ id, status: 'error', msg: err.message });
            }
        });

        // 保持一段时间后关闭
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
            resolve({ id, status: connected ? 'ok' : 'closed_before_open' });
        }, HOLD_MS);
    });
}

async function run(concurrency) {
    const total = concurrency || TOTAL;
    console.log('\n================================================');
    console.log(' 测试一：WebSocket 并发连接测试');
    console.log('================================================');
    console.log(` 目标地址  : ${WS_URL}`);
    console.log(` 并发数量  : ${total}`);
    console.log(` 保持时长  : ${HOLD_MS}ms`);
    console.log('------------------------------------------------\n');

    const start = Date.now();

    // 全部同时发起连接
    const promises = [];
    for (let i = 0; i < total; i++) {
        promises.push(connectOne(i + 1));
    }
    await Promise.all(promises);

    const elapsed = Date.now() - start;

    // 统计
    const successRate = ((results.success / total) * 100).toFixed(1);
    const avgConn     = results.latencies.length
        ? (results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length).toFixed(1)
        : '-';
    const minConn = results.latencies.length ? Math.min(...results.latencies) : '-';
    const maxConn = results.latencies.length ? Math.max(...results.latencies) : '-';
    const p95Conn = percentile(results.latencies, 95);

    const avgFirstMsg = results.firstMsgLatencies.length
        ? (results.firstMsgLatencies.reduce((a, b) => a + b, 0) / results.firstMsgLatencies.length).toFixed(0)
        : '-';

    console.log('================ 测试结果 ==================');
    console.log(` 总连接数   : ${total}`);
    console.log(` 成功连接   : ${results.success}  (${successRate}%)`);
    console.log(` 失败连接   : ${results.failed}`);
    console.log(` 超时连接   : ${results.timeouts}`);
    console.log('--------------------------------------------');
    console.log(' 连接建立耗时（ms）:');
    console.log(`   最小  : ${minConn}`);
    console.log(`   平均  : ${avgConn}`);
    console.log(`   最大  : ${maxConn}`);
    console.log(`   P95   : ${p95Conn}`);
    console.log('--------------------------------------------');
    console.log(` 首条消息平均延迟 : ${avgFirstMsg}ms`);
    console.log(` 总耗时           : ${elapsed}ms`);
    console.log('============================================\n');

    // 判断结果
    if (results.success === total) {
        console.log('✅ 全部连接成功，服务端并发能力正常\n');
    } else if (results.success / total >= 0.95) {
        console.log('🟡 成功率 ≥95%，基本正常，少量失败可能是系统资源限制\n');
    } else {
        console.log('❌ 成功率偏低，建议检查服务端并发配置\n');
    }

    return {
        test: 'WebSocket并发连接',
        total,
        success: results.success,
        failed: results.failed,
        successRate: parseFloat(successRate),
        avgConnMs: parseFloat(avgConn),
        p95ConnMs: p95Conn,
        avgFirstMsgMs: parseFloat(avgFirstMsg),
    };
}

// 单独运行
if (require.main === module) {
    run().catch(console.error);
}

module.exports = { run };
