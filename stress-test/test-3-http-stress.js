/**
 * 测试三：HTTP API 压力测试
 * 目标：对后端5个核心接口并发施压，统计：
 *   - QPS（每秒请求数）
 *   - 响应延迟（min/avg/P95/P99/max）
 *   - 错误率
 *   - 状态码分布
 *
 * 使用 Node.js 原生 http 模块，无需安装额外依赖
 */

'use strict';

const http = require('http');

// ========== 配置 ==========
const BASE_URL    = 'http://localhost:3001';
const CONCURRENCY = 20;   // 并发数
const DURATION_MS = 15000; // 每个接口测试时长
const ENDPOINTS   = [
    { name: '仪表板概览',   path: '/api/dashboard/overview' },
    { name: '告警列表',     path: '/api/alerts?limit=10&offset=0' },
    { name: '服务器列表',   path: '/api/servers' },
    { name: '历史指标',     path: '/api/metrics/history?days=7' },
    { name: '健康检查',     path: '/health' },
];
// ==========================

function httpGet(urlPath) {
    return new Promise((resolve) => {
        const t0 = Date.now();
        const req = http.get(`${BASE_URL}${urlPath}`, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 400,
                    status: res.statusCode,
                    ms: Date.now() - t0,
                });
            });
        });
        req.on('error', (e) => {
            resolve({ ok: false, status: 0, ms: Date.now() - t0, error: e.message });
        });
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ ok: false, status: 0, ms: Date.now() - t0, error: 'timeout' });
        });
    });
}

function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx];
}

async function stressEndpoint(endpoint) {
    console.log(`  ▶ 测试: ${endpoint.name}  (${endpoint.path})`);

    const latencies = [];
    const statusCodes = {};
    let errors = 0;
    let total = 0;

    const endTime = Date.now() + DURATION_MS;

    // 并发 worker 池
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push((async () => {
            while (Date.now() < endTime) {
                const res = await httpGet(endpoint.path);
                total++;
                latencies.push(res.ms);
                if (res.ok) {
                    statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
                } else {
                    errors++;
                    statusCodes[res.status || 'err'] = (statusCodes[res.status || 'err'] || 0) + 1;
                }
            }
        })());
    }

    await Promise.all(workers);

    const elapsed   = DURATION_MS / 1000;
    const qps       = (total / elapsed).toFixed(1);
    const errorRate = ((errors / total) * 100).toFixed(1);
    const avgMs     = latencies.length
        ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
        : 0;
    const minMs  = latencies.length ? Math.min(...latencies) : 0;
    const maxMs  = latencies.length ? Math.max(...latencies) : 0;
    const p95Ms  = percentile(latencies, 95);
    const p99Ms  = percentile(latencies, 99);

    const statusStr = Object.entries(statusCodes)
        .map(([k, v]) => `${k}×${v}`).join('  ');

    console.log(`     总请求数  : ${total}`);
    console.log(`     QPS       : ${qps}`);
    console.log(`     错误率    : ${errorRate}%  (${errors}个错误)`);
    console.log(`     延迟(ms)  : min=${minMs}  avg=${avgMs}  P95=${p95Ms}  P99=${p99Ms}  max=${maxMs}`);
    console.log(`     状态码    : ${statusStr}`);

    if (parseFloat(errorRate) === 0) {
        console.log('     ✅ 无错误\n');
    } else if (parseFloat(errorRate) <= 1) {
        console.log('     🟡 错误率偏低，可接受\n');
    } else {
        console.log('     ❌ 错误率过高\n');
    }

    return {
        name: endpoint.name,
        path: endpoint.path,
        total,
        qps: parseFloat(qps),
        errorRate: parseFloat(errorRate),
        latency: { min: minMs, avg: parseFloat(avgMs), p95: p95Ms, p99: p99Ms, max: maxMs },
        statusCodes,
    };
}

async function run() {
    console.log('\n================================================');
    console.log(' 测试三：HTTP API 压力测试');
    console.log('================================================');
    console.log(` 目标地址  : ${BASE_URL}`);
    console.log(` 并发数    : ${CONCURRENCY}`);
    console.log(` 每接口    : ${DURATION_MS / 1000}s`);
    console.log(` 接口数    : ${ENDPOINTS.length}`);
    console.log('------------------------------------------------\n');

    const allResults = [];
    for (const ep of ENDPOINTS) {
        const r = await stressEndpoint(ep);
        allResults.push(r);
    }

    // 汇总
    const totalReqs    = allResults.reduce((s, r) => s + r.total, 0);
    const totalErrors  = allResults.reduce((s, r) => s + Math.round(r.total * r.errorRate / 100), 0);
    const overallErr   = ((totalErrors / totalReqs) * 100).toFixed(1);
    const maxQPS       = Math.max(...allResults.map(r => r.qps));
    const avgP99       = (allResults.reduce((s, r) => s + r.latency.p99, 0) / allResults.length).toFixed(0);

    console.log('================ 汇总 ==================');
    console.log(` 总请求数         : ${totalReqs}`);
    console.log(` 总错误数         : ${totalErrors}  (${overallErr}%)`);
    console.log(` 最高 QPS 接口    : ${allResults.find(r => r.qps === maxQPS)?.name}  (${maxQPS} req/s)`);
    console.log(` 平均 P99 延迟    : ${avgP99}ms`);
    console.log('========================================\n');

    return {
        test: 'HTTP API压力',
        endpoints: allResults,
        totalReqs,
        overallErrorRate: parseFloat(overallErr),
        maxQPS,
        avgP99Ms: parseFloat(avgP99),
    };
}

if (require.main === module) {
    run().catch(console.error);
}

module.exports = { run };
