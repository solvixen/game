/**
 * 测试二：WebSocket 消息吞吐量测试
 * 目标：统计 N 个客户端在 30 秒内接收到的：
 *   - 消息总数 / 每秒消息数
 *   - 总数据量 / 每秒数据量（KB/s）
 *   - 消息类型分布（gameData / alert）
 *   - 消息丢失率（根据预期推送频率估算）
 */

'use strict';

const WebSocket = require('ws');

// ========== 配置 ==========
const WS_URL      = 'ws://localhost:3002';
const CLIENTS     = parseInt(process.argv[2]) || 20;   // 同时监听的客户端数（命令行: node test-2-ws-throughput.js 50）
const DURATION_MS = 30000; // 测试时长（30秒）
const PUSH_INTERVAL_MS = 3000; // 后端推送间隔（与 websocket/index.js 一致）
// ==========================

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx];
}

async function run(concurrency) {
    const clients = concurrency || CLIENTS;
    console.log('\n================================================');
    console.log(' 测试二：WebSocket 消息吞吐量测试');
    console.log('================================================');
    console.log(` 目标地址  : ${WS_URL}`);
    console.log(` 客户端数  : ${clients}`);
    console.log(` 测试时长  : ${DURATION_MS / 1000}s`);
    console.log('------------------------------------------------\n');

    const stats = {
        totalMessages: 0,
        totalBytes: 0,
        byType: { gameData: 0, alert: 0, other: 0 },
        msgSizeSamples: [],
        secondBuckets: new Array(Math.ceil(DURATION_MS / 1000)).fill(0),
    };

    const startTime = Date.now();
    const clients = [];

    for (let i = 0; i < clients; i++) {
        const ws = new WebSocket(WS_URL);
        clients.push(ws);

        ws.on('message', (rawBuf) => {
            const now = Date.now();
            if (now - startTime > DURATION_MS) return;

            const raw = typeof rawBuf === 'string' ? rawBuf : rawBuf.toString();
            const byteLen = Buffer.byteLength(raw, 'utf8');

            stats.totalMessages++;
            stats.totalBytes += byteLen;
            stats.msgSizeSamples.push(byteLen);

            // 秒级桶（用于每秒消息数图）
            const bucket = Math.floor((now - startTime) / 1000);
            if (bucket < stats.secondBuckets.length) {
                stats.secondBuckets[bucket]++;
            }

            try {
                const data = JSON.parse(raw);
                if (data.type === 'gameData') stats.byType.gameData++;
                else if (data.type === 'alert')    stats.byType.alert++;
                else                               stats.byType.other++;
            } catch (e) {
                stats.byType.other++;
            }
        });

        ws.on('error', (err) => {
            // 静默忽略，结尾统计即可
        });
    }

    // 等待测试时长
    await new Promise(resolve => setTimeout(resolve, DURATION_MS + 500));

    // 关闭所有连接
    clients.forEach(ws => {
        try { ws.close(); } catch (e) {}
    });

    const elapsed = DURATION_MS / 1000;

    // 计算指标
    const avgMsgPerSec  = (stats.totalMessages / elapsed).toFixed(1);
    const avgKBPerSec   = (stats.totalBytes / 1024 / elapsed).toFixed(2);
    const expectedMsgs  = clients * Math.floor(DURATION_MS / PUSH_INTERVAL_MS);
    const lossRate      = Math.max(0, ((expectedMsgs - stats.totalMessages) / expectedMsgs * 100)).toFixed(1);

    const avgMsgSize    = stats.msgSizeSamples.length
        ? (stats.msgSizeSamples.reduce((a, b) => a + b, 0) / stats.msgSizeSamples.length).toFixed(0)
        : 0;
    const maxMsgSize    = stats.msgSizeSamples.length ? Math.max(...stats.msgSizeSamples) : 0;

    const nonEmptyBuckets = stats.secondBuckets.filter(v => v > 0);
    const peakPerSec = nonEmptyBuckets.length ? Math.max(...nonEmptyBuckets) : 0;
    const minPerSec  = nonEmptyBuckets.length ? Math.min(...nonEmptyBuckets) : 0;

    console.log('================ 测试结果 ==================');
    console.log(` 测试时长         : ${elapsed}s`);
    console.log(` 实收消息总数     : ${stats.totalMessages}`);
    console.log(` 预期消息总数     : ${expectedMsgs}  (${clients}客户端 × ${Math.floor(DURATION_MS/PUSH_INTERVAL_MS)}条)`);
    console.log(` 消息丢失率       : ${lossRate}%`);
    console.log('--------------------------------------------');
    console.log(' 吞吐量:');
    console.log(`   平均消息数/s   : ${avgMsgPerSec}`);
    console.log(`   峰值消息数/s   : ${peakPerSec}`);
    console.log(`   最低消息数/s   : ${minPerSec}`);
    console.log(`   平均数据量/s   : ${avgKBPerSec} KB/s`);
    console.log(`   总数据量       : ${formatBytes(stats.totalBytes)}`);
    console.log('--------------------------------------------');
    console.log(' 消息大小:');
    console.log(`   平均           : ${avgMsgSize} B`);
    console.log(`   最大           : ${maxMsgSize} B`);
    console.log('--------------------------------------------');
    console.log(' 消息类型分布:');
    console.log(`   gameData       : ${stats.byType.gameData}`);
    console.log(`   alert          : ${stats.byType.alert}`);
    console.log(`   其他           : ${stats.byType.other}`);
    console.log('--------------------------------------------');
    console.log(' 每秒消息数趋势（前15秒）:');
    const display = stats.secondBuckets.slice(0, 15);
    display.forEach((v, i) => {
        const bar = '█'.repeat(Math.round(v / (clients || 1)));
        console.log(`   第${String(i + 1).padStart(2)}秒  ${String(v).padStart(4)} ${bar}`);
    });
    console.log('============================================\n');

    if (parseFloat(lossRate) <= 5) {
        console.log('✅ 消息丢失率 ≤5%，吞吐量正常\n');
    } else if (parseFloat(lossRate) <= 15) {
        console.log('🟡 消息丢失率偏高，可能受网络/系统资源限制\n');
    } else {
        console.log('❌ 消息丢失率过高，建议检查后端推送逻辑\n');
    }

    return {
        test: 'WebSocket消息吞吐量',
        totalMessages: stats.totalMessages,
        expectedMessages: expectedMsgs,
        lossRate: parseFloat(lossRate),
        avgMsgPerSec: parseFloat(avgMsgPerSec),
        peakMsgPerSec: peakPerSec,
        avgKBPerSec: parseFloat(avgKBPerSec),
        totalBytes: stats.totalBytes,
    };
}

if (require.main === module) {
    run().catch(console.error);
}

module.exports = { run };
