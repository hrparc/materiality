#!/bin/bash

# 미디어 분석 API 테스트 스크립트

echo "=================================="
echo "📰 미디어 분석 API 테스트"
echo "=================================="

# 서버 URL
BASE_URL="http://localhost:3001"

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "1️⃣  서버 헬스 체크..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
echo "$HEALTH_RESPONSE" | jq '.'

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 서버가 실행 중이지 않습니다. 먼저 서버를 시작하세요:${NC}"
    echo "   cd backend && npm start"
    exit 1
fi

echo ""
echo "2️⃣  POST /api/media/analyze 테스트 (새 엔드포인트)..."
echo "   키워드: 삼성전자, 기간: 1년, 최대결과: 10개"

ANALYZE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/media/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "삼성전자",
    "period": "y1",
    "maxResults": 10
  }')

echo ""
echo "📊 응답 결과:"
echo "$ANALYZE_RESPONSE" | jq '.'

# 성공 여부 확인
SUCCESS=$(echo "$ANALYZE_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    echo -e "\n${GREEN}✅ API 테스트 성공!${NC}"

    TOTAL_NEWS=$(echo "$ANALYZE_RESPONSE" | jq -r '.stats.totalNews')
    ESG_NEWS=$(echo "$ANALYZE_RESPONSE" | jq -r '.stats.esgRelatedNews')

    echo "   총 뉴스: $TOTAL_NEWS 개"
    echo "   ESG 관련 뉴스: $ESG_NEWS 개"
else
    echo -e "\n${RED}❌ API 테스트 실패${NC}"
    ERROR_MSG=$(echo "$ANALYZE_RESPONSE" | jq -r '.message // .error')
    echo "   에러: $ERROR_MSG"
fi

echo ""
echo "=================================="
echo "테스트 완료"
echo "=================================="
