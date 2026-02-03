import { getGeminiModel } from '../config/gemini.js';
import { DeduplicationService } from './deduplication-service.js';

/**
 * 뉴스 스크래핑 및 분석 서비스
 * Naver Search API를 사용하여 뉴스를 수집하고 Gemini로 분석
 */
export class NewsScraper {
  constructor(genAI) {
    this.genAI = genAI;
    this.flashModel = getGeminiModel(genAI, 'flash');
    this.deduplicationService = new DeduplicationService(genAI);
  }

  /**
   * 키워드 기반 뉴스 검색
   * @param {string} keyword - 검색 키워드 (예: "삼성전자 ESG")
   * @param {number} maxResults - 최대 결과 수 (기본: 50)
   * @param {string} period - 검색 기간 (y1: 1년, m6: 6개월, m3: 3개월, m1: 1개월)
   * @returns {Promise<Array>} 뉴스 기사 배열
   */
  async searchNews(keyword, maxResults = 50, period = 'y1') {
    console.log(`\n🔍 뉴스 검색: "${keyword}" (기간: ${period})`);

    try {
      // 네이버 뉴스 검색 API 사용
      const news = await this.searchNewsWithNaver(keyword, maxResults, period);

      console.log(`✅ ${news.length}개 뉴스 기사 수집 완료`);
      return news;

    } catch (error) {
      console.error('❌ 뉴스 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 네이버 뉴스 검색 API 호출
   * @param {string} keyword - 검색 키워드
   * @param {number} maxResults - 최대 결과 수
   * @param {string} period - 검색 기간 (y1: 1년, m6: 6개월, m3: 3개월, m1: 1개월) - 네이버는 기간 필터 미지원
   */
  async searchNewsWithNaver(keyword, maxResults = 50, period = 'y1') {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('⚠️  네이버 검색 API 키가 설정되지 않았습니다. Mock 데이터를 사용합니다.');
      return this.generateMockNews(keyword, maxResults);
    }

    const results = [];
    // 네이버 API는 한 번에 최대 100개, display 파라미터로 지정
    const perPage = Math.min(100, maxResults);
    const queries = Math.ceil(maxResults / perPage);

    for (let i = 0; i < queries; i++) {
      const start = i * perPage + 1;
      const display = Math.min(perPage, maxResults - results.length);

      // 네이버 뉴스 검색 API URL (최신순 정렬)
      const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=date`;

      try {
        const response = await fetch(url, {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
        });

        // HTTP 상태 코드 확인
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP 에러 (페이지 ${i + 1}): ${response.status} ${response.statusText}`);
          console.error(`   응답 내용:`, errorText);

          // 401 에러 (인증 실패) 처리
          if (response.status === 401) {
            throw new Error('네이버 API 인증 오류: Client ID/Secret을 확인하세요.');
          }

          // 403 에러 (권한 오류) 처리
          if (response.status === 403) {
            throw new Error('네이버 API 권한 오류: 등록된 URL을 확인하세요.');
          }

          // 429 에러 (할당량 초과) 처리
          if (response.status === 429) {
            throw new Error('네이버 API 할당량 초과: 잠시 후 다시 시도하세요.');
          }

          // 첫 요청 실패 시 Mock 데이터 사용
          if (i === 0) {
            console.warn('⚠️  API 에러로 인해 Mock 데이터를 사용합니다.');
            return this.generateMockNews(keyword, maxResults);
          }
          break;
        }

        const data = await response.json();

        // 네이버 API 응답 확인
        if (data.items && data.items.length > 0) {
          console.log(`   ✓ 페이지 ${i + 1}: ${data.items.length}개 결과 발견`);

          // 네이버 API 응답을 통일된 형식으로 변환
          const articles = data.items.map(item => ({
            title: this.cleanHtmlTags(item.title), // HTML 태그 제거 (<b>, </b> 등)
            snippet: this.cleanHtmlTags(item.description),
            link: item.link,
            publishDate: this.parseNaverDate(item.pubDate), // 날짜 형식 변환
            originalLink: item.originallink, // 원본 기사 링크
          }));

          results.push(...articles);

          // 더 이상 결과가 없으면 중단
          if (data.items.length < display) {
            console.log(`   ℹ️  모든 검색 결과를 가져왔습니다.`);
            break;
          }
        } else {
          console.log(`   ⚠️  페이지 ${i + 1}: 결과 없음`);
          break;
        }

        // API 요청 제한 고려 (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ 뉴스 검색 API 호출 실패 (페이지 ${i + 1}):`, error.message);

        // 첫 번째 요청에서 실패 시 Mock 데이터 사용
        if (i === 0) {
          console.warn('⚠️  API 호출 실패로 인해 Mock 데이터를 사용합니다.');
          return this.generateMockNews(keyword, maxResults);
        }
        break;
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * HTML 태그 제거 (네이버 API는 <b> 태그 포함)
   * @private
   */
  cleanHtmlTags(text) {
    if (!text) return '';
    return text.replace(/<\/?[^>]+(>|$)/g, '').trim();
  }

  /**
   * 네이버 날짜 형식을 ISO 형식으로 변환
   * @private
   * @example "Tue, 03 Feb 2026 14:30:00 +0900" => "2026-02-03T05:30:00.000Z"
   */
  parseNaverDate(dateString) {
    if (!dateString) return new Date().toISOString();

    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (error) {
      console.error('날짜 파싱 실패:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Gemini로 뉴스 분석 및 ESG 이슈 분류 (2단계 파이프라인)
   * @param {Array} newsArticles - 뉴스 기사 배열
   * @param {boolean} useTwoStage - 2단계 파이프라인 사용 여부 (기본: true, 100개 이상일 때 자동 적용)
   * @returns {Promise<Array>} 분석된 뉴스 배열
   */
  async analyzeNews(newsArticles, useTwoStage = null) {
    // 자동 결정: 100개 이상이면 2단계 파이프라인 사용
    const shouldUseTwoStage = useTwoStage !== null ? useTwoStage : newsArticles.length >= 100;

    if (shouldUseTwoStage) {
      console.log(`\n🚀 2단계 파이프라인 분석 시작: ${newsArticles.length}개 뉴스`);
      return await this.analyzeTwoStage(newsArticles);
    } else {
      console.log(`\n🤖 Gemini로 ${newsArticles.length}개 뉴스 분석 시작`);
      return await this.analyzeStandard(newsArticles);
    }
  }

  /**
   * 표준 분석 (기존 방식)
   * @private
   */
  async analyzeStandard(newsArticles) {
    const analyzedNews = [];

    for (let i = 0; i < newsArticles.length; i++) {
      const article = newsArticles[i];

      try {
        const analysis = await this.analyzeArticle(article);
        analyzedNews.push({
          ...article,
          analysis,
        });

        if ((i + 1) % 10 === 0) {
          console.log(`   진행 중: ${i + 1}/${newsArticles.length} 기사 분석 완료`);
        }

        // API 요청 제한 고려
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ⚠️  기사 분석 실패 (${i + 1}):`, error.message);
        analyzedNews.push({
          ...article,
          analysis: null,
        });
      }
    }

    console.log(`✅ ${analyzedNews.length}개 뉴스 분석 완료\n`);
    return analyzedNews;
  }

  /**
   * 2단계 파이프라인 분석
   * Stage 1: 빠른 ESG 필터링 (제목만, Gemini Flash)
   * Stage 2: 상세 이슈 추출 (필터링된 기사만)
   * @private
   */
  async analyzeTwoStage(newsArticles) {
    // Stage 1: 빠른 ESG 필터링
    console.log(`\n   [Stage 1] 빠른 ESG 필터링 시작...`);
    const esgFiltered = await this.quickESGFilter(newsArticles);
    console.log(`   [Stage 1] 완료: ${newsArticles.length}개 → ${esgFiltered.length}개 (${((1 - esgFiltered.length / newsArticles.length) * 100).toFixed(1)}% 필터링)`);

    // Stage 2: 상세 분석 (필터링된 기사만)
    console.log(`\n   [Stage 2] 상세 이슈 추출 시작...`);
    const analyzedNews = await this.analyzeStandard(esgFiltered);
    console.log(`   [Stage 2] 완료: ${analyzedNews.length}개 기사 분석 완료`);

    // 필터링된 기사들 (ESG 무관)
    const filteredOut = newsArticles.filter(
      article => !esgFiltered.find(filtered => filtered.link === article.link)
    );

    // 필터링된 기사도 결과에 포함 (analysis: null)
    const allNews = [
      ...analyzedNews,
      ...filteredOut.map(article => ({
        ...article,
        analysis: {
          isESGRelated: false,
          esgCategories: [],
          issues: [],
          sentiment: 'neutral',
          relevanceScore: 0,
        },
      })),
    ];

    console.log(`✅ 2단계 파이프라인 완료: 총 ${allNews.length}개 (ESG 관련: ${analyzedNews.length}개)\n`);
    return allNews;
  }

  /**
   * Stage 1: 빠른 ESG 필터링 (제목만 분석)
   * @private
   */
  async quickESGFilter(newsArticles) {
    const esgRelated = [];
    const batchSize = 50; // 배치 크기

    for (let i = 0; i < newsArticles.length; i += batchSize) {
      const batch = newsArticles.slice(i, i + batchSize);

      try {
        // 제목만 추출하여 한 번에 분석
        const titles = batch.map((article, idx) => `${idx + 1}. ${article.title}`).join('\n');

        const prompt = `
다음은 뉴스 기사 제목 목록입니다. 각 제목이 ESG (환경, 사회, 지배구조) 이슈와 관련이 있는지 빠르게 판단해주세요.

제목 목록:
${titles}

다음 형식으로 JSON 배열로 응답해주세요 (번호만):
[1, 3, 5, ...]  (ESG 관련이 있는 제목의 번호만 포함)

ESG 관련 키워드 예시:
- 환경(E): 탄소, 배출, 에너지, 기후, 환경, 폐기물, 재생에너지
- 사회(S): 인권, 노동, 안전, 다양성, 지역사회, 공급망
- 지배구조(G): 윤리, 부패, 이사회, 준법, 투명성
`;

        const result = await this.flashModel.generateContent(prompt);
        const response = result.response.text();

        // JSON 파싱
        const jsonMatch = response.match(/\[([\d,\s]+)\]/);
        if (jsonMatch) {
          const esgIndices = jsonMatch[1].split(',').map(n => parseInt(n.trim()) - 1);

          // ESG 관련 기사만 추가
          esgIndices.forEach(idx => {
            if (idx >= 0 && idx < batch.length) {
              esgRelated.push(batch[idx]);
            }
          });
        }

        console.log(`      ✓ 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(newsArticles.length / batchSize)} 완료`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`      ⚠️  배치 ${Math.floor(i / batchSize) + 1} 필터링 실패:`, error.message);
        // 실패 시 해당 배치 전체를 ESG 관련으로 간주 (안전하게)
        esgRelated.push(...batch);
      }
    }

    return esgRelated;
  }

  /**
   * 단일 뉴스 기사 분석
   * @private
   */
  async analyzeArticle(article) {
    const prompt = `
다음 뉴스 기사를 분석하여 ESG 이슈와의 관련성을 평가해주세요.

제목: ${article.title}
내용: ${article.snippet}

다음 형식으로 JSON 응답해주세요:
{
  "isESGRelated": true/false,
  "esgCategories": ["E", "S", "G"] 중 해당되는 것들,
  "issues": ["구체적인 이슈명들"],
  "sentiment": "positive/negative/neutral",
  "relevanceScore": 1-5 (1: 매우 낮음, 5: 매우 높음)
}
`;

    const result = await this.flashModel.generateContent(prompt);
    const response = result.response.text();

    // JSON 파싱
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('   ⚠️  JSON 파싱 실패:', error.message);
    }

    return null;
  }

  /**
   * PRD 5.4항 기준에 따른 미디어 점수 계산
   * @param {Array} analyzedNews - 분석된 뉴스 배열
   * @param {Object} issueKeywords - 이슈별 키워드 맵
   * @returns {Object} 이슈별 미디어 점수 (1~5점)
   */
  calculateMediaScores(analyzedNews, issueKeywords) {
    console.log('\n📊 미디어 점수 계산 중...');

    const issueScores = {};

    for (const [issueName, keywords] of Object.entries(issueKeywords)) {
      // 해당 이슈와 관련된 뉴스 필터링
      const relatedNews = analyzedNews.filter(news => {
        if (!news.analysis || !news.analysis.isESGRelated) return false;

        const titleLower = news.title.toLowerCase();
        const snippetLower = news.snippet.toLowerCase();

        return keywords.some(keyword =>
          titleLower.includes(keyword.toLowerCase()) ||
          snippetLower.includes(keyword.toLowerCase())
        );
      });

      const totalNews = analyzedNews.length;
      const relatedCount = relatedNews.length;
      const exposureRate = totalNews > 0 ? (relatedCount / totalNews) * 100 : 0;

      // 부정적 뉴스 비율 계산
      const negativeCount = relatedNews.filter(
        news => news.analysis?.sentiment === 'negative'
      ).length;
      const negativeRate = relatedCount > 0 ? (negativeCount / relatedCount) * 100 : 0;

      // PRD 5.4항 기준에 따른 점수 계산
      let score = 1;

      if (exposureRate >= 10 && negativeRate >= 70) {
        score = 5; // 최고점: 노출 빈도 상위 10% 이내 및 부정적 맥락 70% 이상
      } else if (exposureRate >= 10 && exposureRate <= 50) {
        score = 3; // 중간점: 노출 빈도 10%~50% 범위
      } else if (exposureRate < 10) {
        score = 1; // 최저점: 노출 빈도 하위
      }

      issueScores[issueName] = {
        score,
        exposureRate: exposureRate.toFixed(2),
        relatedNewsCount: relatedCount,
        negativeRate: negativeRate.toFixed(2),
        details: {
          totalNews,
          relatedNews: relatedCount,
          negativeNews: negativeCount,
        },
      };
    }

    console.log(`✅ ${Object.keys(issueScores).length}개 이슈 점수 계산 완료\n`);
    return issueScores;
  }

  /**
   * 뉴스에서 추출된 이슈의 빈도수 집계 및 상위 이슈 추천
   * @param {Array} analyzedNews - AI 분석이 완료된 뉴스 배열
   * @param {number} topN - 추천할 상위 이슈 개수 (기본: 10)
   * @param {boolean} enableDeduplication - 중복 제거 활성화 여부 (기본: true)
   * @returns {Promise<Array>} 빈도수 높은 상위 이슈 목록
   */
  async recommendTopIssues(analyzedNews, topN = 10, enableDeduplication = true) {
    console.log('\n📊 이슈 빈도수 집계 및 추천 시작...');

    // ESG 관련 뉴스만 필터링
    const esgNews = analyzedNews.filter(news => news.analysis?.isESGRelated);

    if (esgNews.length === 0) {
      console.log('⚠️  ESG 관련 뉴스가 없습니다.');
      return [];
    }

    console.log(`   ESG 관련 뉴스: ${esgNews.length}개`);

    // 중복 제거 (옵션)
    let processedNews = esgNews;
    if (enableDeduplication) {
      processedNews = await this.deduplicationService.deduplicateArticles(esgNews);
    }

    // 이슈별 빈도수 및 관련 뉴스 집계
    const issueMap = new Map();

    processedNews.forEach(news => {
      const issues = news.analysis?.issues || [];
      const duplicateWeight = news.duplicate_count || 1; // 중복 개수를 가중치로 사용

      issues.forEach(issueName => {
        if (!issueMap.has(issueName)) {
          issueMap.set(issueName, {
            이슈명: issueName,
            언급횟수: 0,
            실제_기사수: 0, // 중복 포함 실제 기사 수
            관련_뉴스: [],
            긍정_뉴스: 0,
            부정_뉴스: 0,
            중립_뉴스: 0,
            ESG_카테고리: new Set(),
          });
        }

        const issueData = issueMap.get(issueName);
        issueData.언급횟수++;
        issueData.실제_기사수 += duplicateWeight; // 중복 개수 반영

        // 대표 뉴스 추가 (최대 5개)
        if (issueData.관련_뉴스.length < 5) {
          issueData.관련_뉴스.push({
            제목: news.title,
            설명: news.snippet,  // 네이버 API의 description
            링크: news.link,
            원문링크: news.originalLink,
            날짜: news.publishDate,
            감정: news.analysis.sentiment,
            중복_개수: duplicateWeight, // 중복 정보 포함
          });
        }

        // 감정 분석 집계 (중복 개수 반영)
        if (news.analysis.sentiment === 'positive') {
          issueData.긍정_뉴스 += duplicateWeight;
        } else if (news.analysis.sentiment === 'negative') {
          issueData.부정_뉴스 += duplicateWeight;
        } else {
          issueData.중립_뉴스 += duplicateWeight;
        }

        // ESG 카테고리 집계
        if (news.analysis.esgCategories) {
          news.analysis.esgCategories.forEach(cat => issueData.ESG_카테고리.add(cat));
        }
      });
    });

    // Map을 배열로 변환하고 실제 기사수로 정렬 (중복 반영)
    const sortedIssues = Array.from(issueMap.values())
      .map(issue => ({
        ...issue,
        ESG_카테고리: Array.from(issue.ESG_카테고리),
        부정_비율: issue.실제_기사수 > 0
          ? ((issue.부정_뉴스 / issue.실제_기사수) * 100).toFixed(1)
          : 0,
        긍정_비율: issue.실제_기사수 > 0
          ? ((issue.긍정_뉴스 / issue.실제_기사수) * 100).toFixed(1)
          : 0,
      }))
      .sort((a, b) => b.실제_기사수 - a.실제_기사수) // 실제 기사수로 정렬
      .slice(0, topN);

    console.log(`✅ 총 ${issueMap.size}개 이슈 중 상위 ${sortedIssues.length}개 추천\n`);

    // 상위 이슈 요약 출력
    sortedIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.이슈명} (${issue.실제_기사수}회, 부정 ${issue.부정_비율}%)`);
    });

    return sortedIssues;
  }

  /**
   * Mock 뉴스 데이터 생성 (테스트용)
   * @private
   */
  generateMockNews(keyword, count) {
    const mockNews = [];
    const esgTopics = [
      '온실가스 배출 감축',
      '재생에너지 전환',
      '산업안전보건',
      '근로자 인권',
      '공급망 관리',
      '데이터 프라이버시',
      '이사회 다양성',
      '윤리경영',
    ];

    for (let i = 0; i < count; i++) {
      const topic = esgTopics[i % esgTopics.length];
      const sentiment = Math.random() > 0.5 ? 'positive' : 'negative';

      mockNews.push({
        title: `${keyword} ${topic} 관련 ${sentiment === 'positive' ? '개선' : '논란'} (${i + 1})`,
        snippet: `${keyword}가 ${topic}과 관련하여 ${sentiment === 'positive' ? '긍정적인 성과를 달성' : '부정적인 이슈가 제기'}되었습니다. 최근 1년간의 데이터를 분석한 결과...`,
        link: `https://news.example.com/article-${i + 1}`,
        publishDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return mockNews;
  }
}
