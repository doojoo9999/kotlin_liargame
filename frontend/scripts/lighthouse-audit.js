const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Lighthouse 감사 도구
class LighthouseAuditor {
  constructor() {
    this.auditResults = {};
  }

  async runAudit(url = 'http://localhost:5173', options = {}) {
    console.log(`🔍 Lighthouse 감사 시작: ${url}`);

    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });

    const lighthouseOptions = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      ...options
    };

    try {
      const runnerResult = await lighthouse(url, lighthouseOptions);

      await chrome.kill();

      const auditResult = this.processLighthouseResults(runnerResult);
      this.auditResults[url] = auditResult;

      return auditResult;
    } catch (error) {
      await chrome.kill();
      throw error;
    }
  }

  async runMultipleAudits() {
    console.log('🔄 다중 페이지 Lighthouse 감사 실행...');

    const urls = [
      { name: 'Main Demo', url: 'http://localhost:5173' },
      { name: 'Phase 4 Demo', url: 'http://localhost:5173/phase4-demo.html' }
    ];

    const results = {};

    for (const { name, url } of urls) {
      console.log(`\n📄 ${name} 감사 중...`);

      try {
        const result = await this.runAudit(url);
        results[name] = result;

        console.log(`✅ ${name} 감사 완료`);
        this.printAuditSummary(name, result);
      } catch (error) {
        console.error(`❌ ${name} 감사 실패:`, error.message);
        results[name] = { error: error.message };
      }
    }

    return results;
  }

  processLighthouseResults(runnerResult) {
    const lhr = runnerResult.lhr;

    const categories = {};
    Object.keys(lhr.categories).forEach(key => {
      const category = lhr.categories[key];
      categories[key] = {
        score: Math.round(category.score * 100),
        title: category.title,
        description: category.description
      };
    });

    const metrics = {
      'first-contentful-paint': this.getMetricValue(lhr, 'first-contentful-paint'),
      'largest-contentful-paint': this.getMetricValue(lhr, 'largest-contentful-paint'),
      'first-meaningful-paint': this.getMetricValue(lhr, 'first-meaningful-paint'),
      'speed-index': this.getMetricValue(lhr, 'speed-index'),
      'interactive': this.getMetricValue(lhr, 'interactive'),
      'total-blocking-time': this.getMetricValue(lhr, 'total-blocking-time'),
      'cumulative-layout-shift': this.getMetricValue(lhr, 'cumulative-layout-shift')
    };

    // 주요 개선사항 추출
    const opportunities = lhr.audits ? Object.values(lhr.audits)
      .filter(audit => audit.score !== null && audit.score < 0.9 && audit.details)
      .map(audit => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: Math.round(audit.score * 100),
        savings: audit.details.overallSavingsMs || 0
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5) : [];

    return {
      categories,
      metrics,
      opportunities,
      timestamp: new Date().toISOString(),
      finalUrl: lhr.finalUrl
    };
  }

  getMetricValue(lhr, metricId) {
    const audit = lhr.audits[metricId];
    if (!audit) return null;

    return {
      value: audit.numericValue,
      displayValue: audit.displayValue,
      score: audit.score ? Math.round(audit.score * 100) : null
    };
  }

  printAuditSummary(name, result) {
    if (result.error) {
      console.log(`❌ ${name}: 감사 실패`);
      return;
    }

    console.log(`\n📊 ${name} 감사 결과:`);

    // 카테고리 점수
    Object.entries(result.categories).forEach(([key, category]) => {
      const emoji = this.getScoreEmoji(category.score);
      console.log(`${emoji} ${category.title}: ${category.score}/100`);
    });

    // 핵심 지표
    console.log('\n⚡ 핵심 성능 지표:');
    if (result.metrics['first-contentful-paint']) {
      console.log(`FCP: ${result.metrics['first-contentful-paint'].displayValue}`);
    }
    if (result.metrics['largest-contentful-paint']) {
      console.log(`LCP: ${result.metrics['largest-contentful-paint'].displayValue}`);
    }
    if (result.metrics['total-blocking-time']) {
      console.log(`TBT: ${result.metrics['total-blocking-time'].displayValue}`);
    }
    if (result.metrics['cumulative-layout-shift']) {
      console.log(`CLS: ${result.metrics['cumulative-layout-shift'].displayValue}`);
    }

    // 개선 기회
    if (result.opportunities.length > 0) {
      console.log('\n💡 주요 개선 기회:');
      result.opportunities.slice(0, 3).forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.title} (${opp.savings}ms 절약 가능)`);
      });
    }
  }

  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
  }

  async generateAuditReport(results) {
    console.log('\n📋 종합 감사 리포트 생성 중...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(results),
      details: results,
      recommendations: this.generateRecommendations(results)
    };

    // HTML 리포트 생성
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(__dirname, '../lighthouse-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    // JSON 리포트 생성
    const jsonPath = path.join(__dirname, '../lighthouse-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    console.log(`📊 HTML 리포트: ${htmlPath}`);
    console.log(`📊 JSON 리포트: ${jsonPath}`);

    return report;
  }

  generateSummary(results) {
    const summary = {
      totalPages: Object.keys(results).length,
      averageScores: {},
      bestPerforming: null,
      needsImprovement: []
    };

    const validResults = Object.entries(results).filter(([_, result]) => !result.error);

    if (validResults.length === 0) return summary;

    // 평균 점수 계산
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    categories.forEach(category => {
      const scores = validResults
        .map(([_, result]) => result.categories[category]?.score || 0)
        .filter(score => score > 0);

      summary.averageScores[category] = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
    });

    // 최고 성능 페이지
    let bestScore = 0;
    validResults.forEach(([name, result]) => {
      const avgScore = Object.values(result.categories)
        .reduce((sum, cat) => sum + cat.score, 0) / Object.keys(result.categories).length;

      if (avgScore > bestScore) {
        bestScore = avgScore;
        summary.bestPerforming = name;
      }
    });

    // 개선 필요 페이지
    validResults.forEach(([name, result]) => {
      const issues = Object.entries(result.categories)
        .filter(([_, cat]) => cat.score < 70)
        .map(([key, cat]) => `${cat.title}: ${cat.score}/100`);

      if (issues.length > 0) {
        summary.needsImprovement.push({ page: name, issues });
      }
    });

    return summary;
  }

  generateRecommendations(results) {
    const recommendations = [];

    Object.entries(results).forEach(([name, result]) => {
      if (result.error) return;

      // 성능 개선
      if (result.categories.performance?.score < 80) {
        recommendations.push({
          category: 'Performance',
          priority: 'High',
          page: name,
          suggestion: '이미지 최적화, 코드 스플리팅, 캐싱 전략 개선'
        });
      }

      // 접근성 개선
      if (result.categories.accessibility?.score < 90) {
        recommendations.push({
          category: 'Accessibility',
          priority: 'High',
          page: name,
          suggestion: 'ARIA 속성 보완, 색상 대비 개선, 키보드 네비게이션 강화'
        });
      }

      // 베스트 프랙티스
      if (result.categories['best-practices']?.score < 85) {
        recommendations.push({
          category: 'Best Practices',
          priority: 'Medium',
          page: name,
          suggestion: '보안 헤더 추가, 최신 API 사용, 콘솔 에러 해결'
        });
      }
    });

    return recommendations;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse 감사 리포트</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .score { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .score.good { color: #0cce6b; }
        .score.average { color: #ffa400; }
        .score.poor { color: #ff4e42; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .page-results { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 6px; }
        .opportunities { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .timestamp { color: #666; font-size: 0.9em; text-align: right; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Phase 5 Lighthouse 감사 리포트</h1>
        <div class="timestamp">생성일: ${new Date(report.timestamp).toLocaleString('ko-KR')}</div>
        
        <h2>📊 전체 요약</h2>
        <div class="summary">
            <div class="metric">
                <div>성능</div>
                <div class="score ${this.getScoreClass(report.summary.averageScores.performance)}">${report.summary.averageScores.performance}</div>
            </div>
            <div class="metric">
                <div>접근성</div>
                <div class="score ${this.getScoreClass(report.summary.averageScores.accessibility)}">${report.summary.averageScores.accessibility}</div>
            </div>
            <div class="metric">
                <div>모범 사례</div>
                <div class="score ${this.getScoreClass(report.summary.averageScores['best-practices'])}">${report.summary.averageScores['best-practices']}</div>
            </div>
            <div class="metric">
                <div>SEO</div>
                <div class="score ${this.getScoreClass(report.summary.averageScores.seo)}">${report.summary.averageScores.seo}</div>
            </div>
        </div>

        ${report.summary.bestPerforming ? `<p><strong>🏆 최고 성능 페이지:</strong> ${report.summary.bestPerforming}</p>` : ''}

        <h2>💡 개선 권장사항</h2>
        <div class="recommendations">
            ${report.recommendations.map(rec => 
                `<div><strong>${rec.category}</strong> (${rec.priority}): ${rec.suggestion}</div>`
            ).join('')}
        </div>

        <h2>📄 페이지별 상세 결과</h2>
        ${Object.entries(report.details).map(([name, result]) => 
            result.error ? 
                `<div class="page-results"><h3>${name}</h3><p style="color: red;">❌ 감사 실패: ${result.error}</p></div>` :
                `<div class="page-results">
                    <h3>${name}</h3>
                    <div class="summary">
                        ${Object.entries(result.categories).map(([key, cat]) => 
                            `<div class="metric">
                                <div>${cat.title}</div>
                                <div class="score ${this.getScoreClass(cat.score)}">${cat.score}</div>
                            </div>`
                        ).join('')}
                    </div>
                    ${result.opportunities.length > 0 ? 
                        `<div class="opportunities">
                            <h4>🔧 개선 기회</h4>
                            ${result.opportunities.map(opp => 
                                `<div>• ${opp.title} (${opp.savings}ms 절약)</div>`
                            ).join('')}
                        </div>` : ''}
                </div>`
        ).join('')}
    </div>
</body>
</html>`;
  }

  getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 70) return 'average';
    return 'poor';
  }
}

// 실행 함수
async function runLighthouseAudit() {
  console.log('🔍 Lighthouse 감사 시작\n');

  const auditor = new LighthouseAuditor();

  try {
    console.log('⚠️  주의: 감사를 실행하기 전에 개발 서버가 실행 중인지 확인하세요 (npm run dev)');
    console.log('⏳ 서버 시작 대기 중... (5초)');

    await new Promise(resolve => setTimeout(resolve, 5000));

    const results = await auditor.runMultipleAudits();
    const report = await auditor.generateAuditReport(results);

    console.log('\n✅ Lighthouse 감사 완료!');
    console.log('📊 리포트 파일이 생성되었습니다.');

    return report;
  } catch (error) {
    console.error('❌ Lighthouse 감사 실패:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runLighthouseAudit();
}

module.exports = { LighthouseAuditor };
