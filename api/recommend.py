# -*- coding: utf-8 -*-
"""
Vercel Serverless Function: /api/recommend
Vercel 배포 환경에서 환경 변수(GEMINI_API_KEY, OPENAI_API_KEY)를 읽어
사용자 작업에 어울리는 최적의 AI 모델을 실시간 추천합니다.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

def fallback_smart_recommend(user_prompt):
    p = user_prompt.lower()
    if any(k in p for k in ['코딩', '코드', '프로그래밍', '디버깅', '파이썬', '자바스크립트', '알고리즘', '개발', 'sql', 'html', '리팩토링']):
        return {
            "intent": "코딩 & 소프트웨어 엔지니어링",
            "primary": {
                "id": "claude-sonnet-3-7",
                "name": "Claude Sonnet 3.7",
                "creator": "Anthropic 🇺🇸",
                "category": "High Performance",
                "reason": "현존 최고 수준의 복합 아키텍처 코딩 및 디버깅 능력을 제공하며, 하이브리드 사고 모드로 복잡한 코드 생성을 오류 없이 수행합니다.",
                "bestProvider": "KIE API",
                "costEst": "$1.50 / 1M 토큰 (공식 대비 -50% 할인)"
            },
            "alternatives": [
                {"id": "qwen-2-5-coder-32b", "name": "Qwen 2.5 Coder 32B", "reason": "오픈 가중치 코딩 전용 모델 중 최강의 벤치마크 가성비."},
                {"id": "deepseek-v3", "name": "DeepSeek-V3", "reason": "대규모 코드베이스 분석에 이상적인 압도적 가성비."}
            ]
        }
    elif any(k in p for k in ['추론', '논리', '수학', 'o1', 'r1', '심층', '증명', '과학']):
        return {
            "intent": "심층 논리 & 고난도 추론 (Reasoning)",
            "primary": {
                "id": "deepseek-r1",
                "name": "DeepSeek-R1",
                "creator": "DeepSeek 🇨🇳",
                "category": "Reasoning",
                "reason": "OpenAI o1과 동등한 최상위 복합 추론 성능(AIME 수학 1위)을 1/10 이하의 파격적인 단가로 제공합니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.55 / 1M 토큰 (공식 대비 -75% 할인)"
            },
            "alternatives": [
                {"id": "o3-mini", "name": "o3-mini", "reason": "OpenAI의 최신 초고속 경량 STEM 추론 모델."},
                {"id": "moonshot-kimi-k1-5", "name": "Moonshot Kimi k1.5", "reason": "200만 토큰 초장문 컨텍스트와 멀티모달 추론 결합."}
            ]
        }
    elif any(k in p for k in ['한국어', '네이버', '업스테이지', '행정', '공공', '보고서', '국내', '법률', '한국']):
        return {
            "intent": "한국 문화·제도·공공 행정 특화 업무",
            "primary": {
                "id": "hyperclova-x",
                "name": "HyperCLOVA X",
                "creator": "네이버 클라우드 🇰🇷",
                "category": "High Performance",
                "reason": "국내 최대 한국어 말뭉치와 공공·금융 규제에 최적화되어 한국어 어휘 뉘앙스와 행정 문서 작성에서 가장 정확합니다.",
                "bestProvider": "네이버 클라우드 (공식)",
                "costEst": "한국어 특화 네이티브 API"
            },
            "alternatives": [
                {"id": "solar-pro", "name": "Solar Pro (22B)", "reason": "한국어/영어 바이링구얼 및 OCR 문서 파싱 특화."},
                {"id": "lg-exaone-3-5", "name": "EXAONE 3.5 (32B)", "reason": "LG의 산업 데이터 전문 지식과 뛰어난 한국어 추론 효율."}
            ]
        }
    elif any(k in p for k in ['영상', '비디오', '동영상', '쇼츠', '릴스', '틱톡', '영화']):
        return {
            "intent": "AI 영상 & 비디오 생성",
            "primary": {
                "id": "pixverse-v3",
                "name": "PixVerse V3",
                "creator": "PixVerse 🇨🇳",
                "category": "Video Generation",
                "reason": "초당 카메라 앵글 제어 및 사실적인 피사체 일관성을 보장하며 경쟁력 있는 생성 단가를 제공합니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.05 / 생성회차 (단일 최저가)"
            },
            "alternatives": [
                {"id": "kling-3-0", "name": "Kling 3.0", "reason": "물리 엔진 기반 극사실적 모션과 시네마틱 연출."},
                {"id": "doubao-seedance-2-0", "name": "Doubao Seedance 2.0", "reason": "바이트댄스의 고품질 비디오 생성 모델."}
            ]
        }
    elif any(k in p for k in ['이미지', '그림', '포스터', '일러스트', '디자인', '사진', '로고']):
        return {
            "intent": "AI 고화질 이미지 & 그래픽 생성",
            "primary": {
                "id": "flux-1-schnell",
                "name": "FLUX.1 Schnell",
                "creator": "Black Forest Labs 🇪🇺",
                "category": "Image Generation",
                "reason": "4스텝 초고속 생성으로 극사실적 디테일과 텍스트 타이포그래피를 완벽 렌더링합니다.",
                "bestProvider": "Together AI",
                "costEst": "$0.003 / 장 (업계 최저가)"
            },
            "alternatives": [
                {"id": "recraft-v3", "name": "Recraft 20B/v3", "reason": "SVG 벡터 및 상업용 그래픽 아트 특화."},
                {"id": "doubao-seedream-3-0", "name": "Doubao Seedream 3.0", "reason": "바이트댄스의 고화질 이미지 파운데이션 모델."}
            ]
        }
    elif any(k in p for k in ['저렴', '가성비', '가장 싼', '최저가', '경량', '소형', '모바일', '온디바이스']):
        return {
            "intent": "초저비용 & 경량 초고속 온디바이스",
            "primary": {
                "id": "doubao-1-5-lite",
                "name": "Doubao 1.5 Lite (Seed Lite)",
                "creator": "ByteDance 🇨🇳",
                "category": "Fast & Lightweight",
                "reason": "100만 토큰당 $0.02~$0.04의 파격적인 최저가로 실시간 초고속 응답을 지원합니다.",
                "bestProvider": "KIE API / BytePlus",
                "costEst": "$0.02 / 1M 토큰 (전체 최저가)"
            },
            "alternatives": [
                {"id": "qwen-2-5-0-5b-instruct", "name": "Qwen 2.5 0.5B Instruct", "reason": "초소형 경량 모델 ($0.015/1M)."},
                {"id": "gemini-3-8-flash", "name": "Gemini 3.8 Flash", "reason": "대용량 멀티모달과 빠른 응답 속도의 초가성비 모델."}
            ]
        }
    else:
        return {
            "intent": "다목적 범용 고성능 AI 작업",
            "primary": {
                "id": "gemini-3-8-flash",
                "name": "Gemini 3.8 Flash",
                "creator": "Google 🇺🇸",
                "category": "High Performance",
                "reason": "텍스트, 비전, 오디오를 통합 처리하며 실시간에 가까운 반응성과 저렴한 토큰 단가를 동시에 만족합니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.08 / 1M 토큰 (공식가 대비 -50% 할인)"
            },
            "alternatives": [
                {"id": "doubao-1-5-pro", "name": "Doubao 1.5 Pro", "reason": "바이트댄스 플래그십 LLM ($0.08/1M 파격 가성비)."},
                {"id": "gpt-4o-mini", "name": "GPT-4o-mini", "reason": "가장 검증된 안정성과 방대한 개발 생태계의 올라운더."}
            ]
        }

def call_gemini(prompt, api_key):
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        system_instruction = (
            "당신은 글로벌 LLM 및 AI 모델 최저가 컨설턴트입니다. "
            "사용자가 하고자 하는 작업 내용을 정밀 분석하여 가장 적합한 AI 모델(OpenAI, Anthropic, Google, DeepSeek, Naver, Upstage, ByteDance 등)을 1개 선정하고 대안 모델 2개를 추천하세요. "
            "반드시 순수한 JSON 형식으로만 응답해야 합니다. "
            "포맷: "
            "{\"intent\": \"작업의도\", \"primary\": {\"name\": \"모델명\", \"creator\": \"개발사\", \"reason\": \"선정이유(한국어)\", \"bestProvider\": \"추천공급처\", \"costEst\": \"예상비용\"}, \"alternatives\": [{\"name\": \"대안1\", \"reason\": \"이유\"}, {\"name\": \"대안2\", \"reason\": \"이유\"}]}"
        )
        body = {
            "contents": [{"parts": [{"text": f"{system_instruction}\n\n사용자 작업: {prompt}"}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
        }
        req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidate = res_data.get('candidates', [{}])[0]
            text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '').strip()
            if text.startswith('```'):
                text = text.split('```')[1]
                if text.startswith('json'):
                    text = text[4:]
                text = text.strip()
            return json.loads(text)
    except Exception as e:
        return None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(post_data)
            user_prompt = data.get('prompt', '').strip()
        except Exception:
            user_prompt = ''

        if not user_prompt:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "추천을 위한 작업 내용을 입력해 주세요."}).encode('utf-8'))
            return

        gemini_key = os.environ.get('GEMINI_API_KEY', '').strip()
        result = None
        if gemini_key and len(gemini_key) > 10:
            result = call_gemini(user_prompt, gemini_key)

        if not result:
            result = fallback_smart_recommend(user_prompt)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
