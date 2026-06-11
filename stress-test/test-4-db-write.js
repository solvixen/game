/**
 * 测试四：数据库写入性能测试
 * 目标：直连 MySQL，批量插入记录，统计：
 *   - 写入 QPS（条/秒）
 *   - 单次写入延迟（min/avg/P95/P99/max）
 *   - 并发写入成功率
 *   - 连接池表现
 *
 * 测试内容：
 *   Round A - 顺序写入（基线）
 *   Round B - 并发写入（压力）
 *   Round C - 混合读写
 */

'use strict';

const mysql = require('mysql2');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

// ========== 配置 ==========
const DB_CONFIG = {
    host:             process.env.DB_HOST     || 'localhost',
    port:             parseInt(process.env.DB_PORT) || 3306,
    user:             process.env.DB_USER     || 'root',
    password:         process.env.DB_PASSWORD || '123456',
    database:         process.env.DB_NAME     || 'game_monitor',
    waitForConnections: true,
    connectionLimit:  20,
    queueLimit:       0,
};
const SEQUENTIAL_COUNT = 200;  // 顺序写入次数
const CONCURRENT_COUNT = 500;  // 并发写入次数
const CONCURRENCY      = 20;   // 并发 worker 数
// ==========================

function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mockMetrics() {
    return [
        randInt(1000, 6000),  // online_players
        randInt(10000, 60000), // revenue
        randInt(3, 8),         // active_servers
        randInt(30, 180),      // avg_latency
    ];
}

function mockAlert() {
    const types  = ['CPU过载', '内存不足', '延迟过高'];
    const levels = ['critical', 'warning', 'info'];
    const t = types[randInt(0, 2)];
    const l = levels[randInt(0, 2)];
    return [l, t, `测试告警: ${t}`, `${randInt(70, 99)}%`, '80%'];
}

async function run() {
    console.log('\n================================================');
    console.log(' 测试四：数据库写入性能测试');
    console.log('================================================');
    console.log(` 数据库    : ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    console.log(` 连接池    : ${DB_CONFIG.connectionLimit}`);
    console.log('------------------------------------------------\n');

    const pool = mysql.createPool(DB_CONFIG).promise();

    // 验证连接
    try {
        await pool.query('SELECT 1');
        console.log('  ✅ 数据库连接成功\n');
    } catch (e) {
        console.error(`  ❌ 数据库连接失败: ${e.message}`);
        console.error('  请确保后端 .env 配置正确且 MySQL 正在运行\n');
        await pool.end();
        return { test: '数据库写入性能', error: e.message };
    }

    const summary = {};

    // -------- Round A: 顺序写入（基线） --------
    console.log(`  ▶ Round A: 顺序写入 ${SEQUENTIAL_COUNT} 条（game_metrics）`);
    const seqLatencies = [];
    let seqErrors = 0;
    const seqStart = Date.now();

    for (let i = 0; i < SEQUENTIAL_COUNT; i++) {
        const t0 = Date.now();
        try {
            await pool.execute(
                'INSERT INTO game_metrics (online_players, revenue, active_servers, avg_latency) VALUES (?, ?, ?, ?)',
                mockMetrics()
            );
            seqLatencies.push(Date.now() - t0);
        } catch (e) {
            seqErrors++;
        }
    }

    const seqElapsed = (Date.now() - seqStart) / 1000;
    const seqQPS     = (SEQUENTIAL_COUNT / seqElapsed).toFixed(1);
    const seqAvg     = (seqLatencies.reduce((a, b) => a + b, 0) / (seqLatencies.length || 1)).toFixed(1);
    const seqP99     = percentile(seqLatencies, 99);
    const seqMax     = seqLatencies.length ? Math.max(...seqLatencies) : 0;

    console.log(`     总耗时  : ${seqElapsed.toFixed(2)}s`);
    console.log(`     写入QPS : ${seqQPS} 条/s`);
    console.log(`     延迟    : avg=${seqAvg}ms  P99=${seqP99}ms  max=${seqMax}ms`);
    console.log(`     错误数  : ${seqErrors}\n`);
    summary.sequential = { qps: parseFloat(seqQPS), avgMs: parseFloat(seqAvg), p99Ms: seqP99, errors: seqErrors };

    // -------- Round B: 并发写入（压力） --------
    console.log(`  ▶ Round B: 并发写入 ${CONCURRENT_COUNT} 条（alerts）  并发数=${CONCURRENCY}`);
    const concLatencies = [];
    let concErrors = 0;
    const concStart = Date.now();

    const tasks = [];
    for (let i = 0; i < CONCURRENT_COUNT; i++) {
        tasks.push((async () => {
            const t0 = Date.now();
            try {
                await pool.execute(
                    'INSERT INTO alerts (level, type, message, value, threshold, status) VALUES (?, ?, ?, ?, ?, "pending")',
                    mockAlert()
                );
                concLatencies.push(Date.now() - t0);
            } catch (e) {
                concErrors++;
            }
        })());
    }
    await Promise.all(tasks);

    const concElapsed = (Date.now() - concStart) / 1000;
    const concQPS     = (CONCURRENT_COUNT / concElapsed).toFixed(1);
    const concAvg     = (concLatencies.reduce((a, b) => a + b, 0) / (concLatencies.length || 1)).toFixed(1);
    const concP99     = percentile(concLatencies, 99);
    const concMax     = concLatencies.length ? Math.max(...concLatencies) : 0;
    const concSuccess = ((concLatencies.length / CONCURRENT_COUNT) * 100).toFixed(1);

    console.log(`     总耗时  : ${concElapsed.toFixed(2)}s`);
    console.log(`     写入QPS : ${concQPS} 条/s`);
    console.log(`     成功率  : ${concSuccess}%`);
    console.log(`     延迟    : avg=${concAvg}ms  P99=${concP99}ms  max=${concMax}ms`);
    console.log(`     错误数  : ${concErrors}\n`);
    summary.concurrent = { qps: parseFloat(concQPS), avgMs: parseFloat(concAvg), p99Ms: concP99, errors: concErrors, successRate: parseFloat(concSuccess) };

    // -------- Round C: 混合读写 --------
    console.log(`  ▶ Round C: 混合读写（写 100 + 读 100，${CONCURRENCY} 并发）`);
    const mixLatencies = [];
    let mixErrors = 0;
    const mixStart = Date.now();
    const mixTasks = [];

    for (let i = 0; i < 100; i++) {
        mixTasks.push((async () => {
            const t0 = Date.now();
            try {
                await pool.execute(
                    'INSERT INTO game_metrics (online_players, revenue, active_servers, avg_latency) VALUES (?, ?, ?, ?)',
                    mockMetrics()
                );
                mixLatencies.push(Date.now() - t0);
            } catch (e) { mixErrors++; }
        })());
    }
    for (let i = 0; i < 100; i++) {
        mixTasks.push((async () => {
            const t0 = Date.now();
            try {
                await pool.query('SELECT * FROM alerts ORDER BY create_time DESC LIMIT 10');
                mixLatencies.push(Date.now() - t0);
            } catch (e) { mixErrors++; }
        })());
    }
    await Promise.all(mixTasks);

    const mixElapsed = (Date.now() - mixStart) / 1000;
    const mixQPS     = (200 / mixElapsed).toFixed(1);
    const mixAvg     = (mixLatencies.reduce((a, b) => a + b, 0) / (mixLatencies.length || 1)).toFixed(1);
    const mixP99     = percentile(mixLatencies, 99);

    console.log(`     总耗时  : ${mixElapsed.toFixed(2)}s`);
    console.log(`     综合QPS : ${mixQPS} ops/s`);
    console.log(`     延迟    : avg=${mixAvg}ms  P99=${mixP99}ms`);
    console.log(`     错误数  : ${mixErrors}\n`);
    summary.mixed = { qps: parseFloat(mixQPS), avgMs: parseFloat(mixAvg), p99Ms: mixP99, errors: mixErrors };

    // -------- 汇总 --------
    console.log('================ 汇总 ==================');
    console.log(` 顺序写入 QPS     : ${summary.sequential.qps} 条/s`);
    console.log(` 并发写入 QPS     : ${summary.concurrent.qps} 条/s（${CONCURRENCY}并发）`);
    console.log(` 混合读写 QPS     : ${summary.mixed.qps} ops/s`);
    console.log(` 并发写入成功率   : ${summary.concurrent.successRate}%`);

    if (summary.concurrent.successRate >= 99) {
        console.log('\n✅ 数据库写入性能正常，连接池配置合理\n');
    } else if (summary.concurrent.successRate >= 95) {
        console.log('\n🟡 并发写入少量失败，可适当增大 connectionLimit\n');
    } else {
        console.log('\n❌ 并发写入失败率过高，检查连接池/MySQL 配置\n');
    }

    await pool.end();
    return { test: '数据库写入性能', ...summary };
}

if (require.main === module) {
    run().catch(console.error);
}

module.exports = { run };
