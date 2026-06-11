/**
 * 压力测试主入口：run-all.js
 * 按序执行5项测试，最后输出综合报告
 *
 * 使用方法：
 *   node stress-test/run-all.js [test-number] [concurrency]
 *
 * 示例：
 *   node stress-test/run-all.js           # 运行全部5项（默认200并发）
 *   node stress-test/run-all.js 1 300     # 只跑测试一，300并发
 *   node stress-test/run-all.js 3         # 只跑测试三
 *   node stress-test/run-all.js 500       # 全部测试，500并发
 *
 * 前提：后端服务已启动
 *   cd backend && node src/app.js
 */

'use strict';

const tests = [
    { id: 1, name: 'WebSocket 并发连接',       module: './test-1-ws-concurrent' },
    { id: 2, name: 'WebSocket 消息吞吐量',     module: './test-2-ws-throughput' },
    { id: 3, name: 'HTTP API 压力',            module: './test-3-http-stress' },
    { id: 4, name: '数据库写入性能',           module: './test-4-db-write' },
    { id: 5, name: '断线重连与心跳保活',       module: './test-5-reconnect' },
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function banner(text) {
    const line = '═'.repeat(50);
    console.log(`\n${line}`);
    console.log(` ${text}`);
    console.log(`${line}`);
}

function formatScore(result) {
    if (!result || result.error) return '❌ 失败/跳过';
    // 根据各测试的关键指标给出简短评价
    if (result.successRate !== undefined) {
        return result.successRate >= 99 ? '✅ 优秀' : result.successRate >= 95 ? '🟡 良好' : '❌ 需优化';
    }
    if (result.lossRate !== undefined) {
        return result.lossRate <= 5 ? '✅ 优秀' : result.lossRate <= 15 ? '🟡 良好' : '❌ 需优化';
    }
    if (result.overallErrorRate !== undefined) {
        return result.overallErrorRate <= 1 ? '✅ 优秀' : result.overallErrorRate <= 5 ? '🟡 良好' : '❌ 需优化';
    }
    if (result.concurrent?.successRate !== undefined) {
        return result.concurrent.successRate >= 99 ? '✅ 优秀' : '🟡 良好';
    }
    if (result.passed !== undefined) {
        return result.passed === result.total ? '✅ 全通过' : `🟡 ${result.passed}/${result.total}`;
    }
    return '✅ 完成';
}

async function main() {
    const args = process.argv.slice(2);
    let targetId = null;
    let concurrency = 200; // 默认200并发

    // 解析参数：支持 node run-all.js [test-id] [concurrency]
    //          node run-all.js [concurrency]（全部测试指定并发）
    if (args.length >= 2) {
        targetId = parseInt(args[0]);
        concurrency = parseInt(args[1]);
    } else if (args.length === 1) {
        const val = parseInt(args[0]);
        if (val >= 1 && val <= 5) {
            targetId = val;          // 指定测试编号
        } else {
            concurrency = val;       // 指定并发数（全部测试）
        }
    }

    const toRun = targetId
        ? tests.filter(t => t.id === targetId)
        : tests;

    if (toRun.length === 0) {
        console.error(`未知测试编号: ${arg}，有效范围 1-5`);
        process.exit(1);
    }

    banner('游戏监控系统 — 压力测试套件');
    console.log(` 时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log(` 运行: ${toRun.map(t => `#${t.id}`).join(', ')}  |  并发: ${concurrency}`);
    console.log('\n⚠  请确保后端已启动: cd backend && node src/app.js\n');

    const allResults = [];
    const startTotal = Date.now();

    for (const t of toRun) {
        banner(`[${t.id}/5] ${t.name}`);
        const testModule = require(t.module);
        let result;
        try {
            result = await testModule.run(concurrency);
        } catch (e) {
            console.error(`\n测试${t.id}异常退出: ${e.message}`);
            result = { test: t.name, error: e.message };
        }
        allResults.push({ id: t.id, name: t.name, result });

        if (t.id < toRun[toRun.length - 1].id) {
            console.log('  (等待 2 秒再运行下一项...)\n');
            await sleep(2000);
        }
    }

    const totalElapsed = ((Date.now() - startTotal) / 1000).toFixed(1);

    // ========== 综合报告 ==========
    banner('综合测试报告');
    console.log(` 完成时间 : ${new Date().toLocaleString('zh-CN')}`);
    console.log(` 总耗时   : ${totalElapsed}s\n`);

    console.log('┌────┬─────────────────────────┬──────────────────────────────────────────┐');
    console.log('│ #  │ 测试项目                │ 结论                                     │');
    console.log('├────┼─────────────────────────┼──────────────────────────────────────────┤');

    for (const { id, name, result } of allResults) {
        const score = formatScore(result);
        const nameCol = name.padEnd(23);
        let detail = '';

        if (result && !result.error) {
            if (id === 1) detail = `成功率${result.successRate}%  P95=${result.p95ConnMs}ms`;
            if (id === 2) detail = `丢包${result.lossRate}%  ${result.avgMsgPerSec}条/s`;
            if (id === 3) detail = `P99=${result.avgP99Ms}ms  最高${result.maxQPS}QPS`;
            if (id === 4) detail = `并发${result.concurrent?.qps}写/s  成功${result.concurrent?.successRate}%`;
            if (id === 5) detail = `${result.passed}/${result.total}场景通过`;
        } else {
            detail = result?.error || '未运行';
        }

        const detailCol = (score + '  ' + detail).padEnd(40);
        console.log(`│ ${id}  │ ${nameCol} │ ${detailCol} │`);
    }

    console.log('└────┴─────────────────────────┴──────────────────────────────────────────┘');

    const passCount = allResults.filter(r => !r.result?.error && formatScore(r.result).startsWith('✅')).length;
    console.log(`\n 优秀: ${passCount}/${allResults.length} 项`);

    if (passCount === allResults.length) {
        console.log('\n🎉 全部测试通过！系统性能表现优秀。\n');
    } else {
        console.log('\n📋 部分测试需关注，参考上方各测试输出进行优化。\n');
    }

    // 输出关键指标建议
    console.log('═══ 参考标准 ════════════════════════════════════════════');
    console.log('  WS 并发连接成功率   : ≥99%（100并发）');
    console.log('  WS 消息丢失率       : ≤5%');
    console.log('  HTTP P99 延迟       : ≤200ms（本地）');
    console.log('  DB 并发写入成功率   : ≥99%（20并发）');
    console.log('  断线重连成功率      : 100%');
    console.log('═════════════════════════════════════════════════════════\n');
}

main().catch(e => {
    console.error('\n测试入口异常:', e.message);
    process.exit(1);
});
