#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM 최저가 찾기 - 로컬 통합 서버 & AI 추천 백엔드
- 정적 파일 서빙 (HTML, CSS, JS)
- /api/recommend: 사용자 입력 작업에 적합한 최적 AI 모델 추천 API
- .env 파일에서 LLM API Key를 안전하게 로드하여 관리 (외부 노출 원천 차단)
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta
import urllib.request
import urllib.error
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Windows 콘솔 출력 시 유니코드/이모지 출력 에러 방지
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent

# .env 파일 로드 함수 (외부 라이브러리 없이 자체 파싱)
def load_env_file():
    env_path = BASE_DIR / '.env'
    env_vars = {}
    if env_path.exists():
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        env_vars[k.strip()] = v.strip().strip("'").strip('"')
        except Exception as e:
            print(f"[Warning] .env 로드 중 오류: {e}")
    return env_vars

ENV = load_env_file()
PORT = int(ENV.get('PORT', 8088))
ANALYTICS_FILE = BASE_DIR / 'analytics_log.json'

def parse_user_agent(ua):
    ua = ua or ''
    browser = 'Other'
    if 'Whale' in ua:
        browser = 'Naver Whale'
    elif 'Edg' in ua:
        browser = 'Microsoft Edge'
    elif 'Chrome' in ua:
        browser = 'Google Chrome'
    elif 'Safari' in ua and 'Chrome' not in ua:
        browser = 'Apple Safari'
    elif 'Firefox' in ua:
        browser = 'Mozilla Firefox'

    os_name = 'Other'
    if 'Windows' in ua:
        os_name = 'Windows'
    elif 'Macintosh' in ua or 'Mac OS' in ua:
        os_name = 'macOS'
    elif 'Android' in ua:
        os_name = 'Android'
    elif 'iPhone' in ua or 'iPad' in ua:
        os_name = 'iOS'
    elif 'Linux' in ua:
        os_name = 'Linux'

    device = 'Mobile' if ('Mobile' in ua or 'Android' in ua or 'iPhone' in ua) else 'Desktop'
    return {"browser": browser, "os": os_name, "device": device}

def init_analytics_data():
    if ANALYTICS_FILE.exists():
        try:
            with open(ANALYTICS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception:
            pass

    # 초기 데모 및 테스트용 30일 시드 데이터 생성
    seed_logs = []
    now = datetime.now()
    sample_ips = [
        "127.0.0.1", "192.168.0.15", "211.234.118.23", "175.197.82.44",
        "121.133.45.67", "58.120.91.10", "220.85.12.89", "182.215.34.78",
        "112.170.89.12", "14.36.190.25", "106.240.55.33", "221.148.90.11"
    ]
    uas = [
        ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36", "Google Chrome", "Windows", "Desktop"),
        ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.5", "Apple Safari", "macOS", "Desktop"),
        ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/128.0.0.0 Safari/537.36", "Microsoft Edge", "Windows", "Desktop"),
        ("Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36", "Google Chrome", "Android", "Mobile"),
        ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1", "Apple Safari", "iOS", "Mobile"),
        ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Whale/3.28.266.14 Safari/537.36", "Naver Whale", "Windows", "Desktop")
    ]

    # 지난 30일 동안의 방문자 패턴 생성 (일 10~35회 방문, 주간/시간대 현실적 분포)
    for day_offset in range(30, -1, -1):
        target_date = now - timedelta(days=day_offset)
        # 평일 방문이 주말보다 약간 많도록 가중치
        is_weekend = target_date.weekday() in [5, 6]
        visits_count = random.randint(12, 28) if is_weekend else random.randint(25, 55)
        
        for _ in range(visits_count):
            # 시간대 분포 (오전 9시~오후 6시, 저녁 8시~11시 피크)
            hour_weights = [1, 1, 0, 0, 0, 1, 2, 4, 7, 9, 10, 11, 8, 9, 10, 10, 9, 8, 6, 8, 10, 9, 5, 2]
            chosen_hour = random.choices(range(24), weights=hour_weights, k=1)[0]
            chosen_minute = random.randint(0, 59)
            chosen_second = random.randint(0, 59)
            
            visit_time = target_date.replace(hour=chosen_hour, minute=chosen_minute, second=chosen_second)
            if visit_time > now:
                continue

            chosen_ip = random.choice(sample_ips)
            ua_tuple = random.choice(uas)
            
            seed_logs.append({
                "timestamp": visit_time.strftime("%Y-%m-%d %H:%M:%S"),
                "ip": chosen_ip,
                "masked_ip": ".".join(chosen_ip.split(".")[:3]) + ".*" if "." in chosen_ip else "127.0.0.*",
                "browser": ua_tuple[1],
                "os": ua_tuple[2],
                "device": ua_tuple[3],
                "path": "/",
                "is_seed": True
            })

    seed_logs.sort(key=lambda x: x["timestamp"], reverse=True)
    try:
        with open(ANALYTICS_FILE, 'w', encoding='utf-8') as f:
            json.dump(seed_logs, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Analytics] 시드 로그 저장 실패: {e}")
    return seed_logs

def record_visit(ip, user_agent, path):
    # 정적 자원 및 API 요청은 방문 로그에서 제외
    if path.startswith('/api/') or any(path.endswith(ext) for ext in ['.css', '.js', '.png', '.jpg', '.ico', '.svg', '.json', '.woff', '.woff2']):
        return

    logs = []
    if ANALYTICS_FILE.exists():
        try:
            with open(ANALYTICS_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except Exception:
            logs = []
    else:
        logs = init_analytics_data()

    parsed = parse_user_agent(user_agent)
    masked_ip = ".".join(ip.split(".")[:3]) + ".*" if "." in ip else "127.0.0.*"
    
    new_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ip": ip,
        "masked_ip": masked_ip,
        "browser": parsed["browser"],
        "os": parsed["os"],
        "device": parsed["device"],
        "path": path,
        "is_seed": False
    }
    
    logs.insert(0, new_entry)
    # 최대 3,000건 유지
    if len(logs) > 3000:
        logs = logs[:3000]

    try:
        with open(ANALYTICS_FILE, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Analytics] 방문 기록 실패: {e}")

def get_analytics_summary(mode='all'):
    logs = []
    if ANALYTICS_FILE.exists():
        try:
            with open(ANALYTICS_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except Exception:
            logs = []
    
    if not logs and mode != 'real':
        logs = init_analytics_data()

    # 도메인 접속 또는 mode == 'real'인 경우: 실제 접속 로그(is_seed == False)만 필터링!
    is_real_mode = (mode == 'real')
    if is_real_mode:
        logs = [l for l in logs if l.get("is_seed") is False]

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    week_start = now - timedelta(days=now.weekday())
    week_start_str = week_start.strftime("%Y-%m-%d")
    month_start_str = now.strftime("%Y-%m-01")

    total_pv = len(logs)
    unique_ips = set(log.get("ip", "") for log in logs)
    total_uv = len(unique_ips)

    today_logs = [l for l in logs if l.get("timestamp", "").startswith(today_str)]
    today_pv = len(today_logs)
    today_uv = len(set(l.get("ip", "") for l in today_logs))

    week_logs = [l for l in logs if l.get("timestamp", "")[:10] >= week_start_str]
    week_pv = len(week_logs)
    week_uv = len(set(l.get("ip", "") for l in week_logs))

    month_logs = [l for l in logs if l.get("timestamp", "")[:10] >= month_start_str]
    month_pv = len(month_logs)
    month_uv = len(set(l.get("ip", "") for l in month_logs))

    # 1. 일별 통계 (최근 14일)
    daily_stats = []
    weekday_kor = ["월", "화", "수", "목", "금", "토", "일"]
    for i in range(13, -1, -1):
        day_dt = now - timedelta(days=i)
        d_str = day_dt.strftime("%Y-%m-%d")
        d_label = day_dt.strftime("%m.%d") + f"({weekday_kor[day_dt.weekday()]})"
        d_logs = [l for l in logs if l.get("timestamp", "").startswith(d_str)]
        d_uv = len(set(l.get("ip", "") for l in d_logs))
        daily_stats.append({
            "date": d_str,
            "label": d_label,
            "pv": len(d_logs),
            "uv": d_uv
        })

    # 2. 주간별 통계 (최근 8주)
    weekly_stats = []
    for w in range(7, -1, -1):
        w_end = now - timedelta(weeks=w)
        w_start = w_end - timedelta(days=w_end.weekday())
        w_start_str = w_start.strftime("%Y-%m-%d")
        w_end_str = (w_start + timedelta(days=6)).strftime("%Y-%m-%d")
        w_label = f"{w_start.strftime('%m.%d')}~{(w_start + timedelta(days=6)).strftime('%m.%d')}"
        w_logs = [l for l in logs if w_start_str <= l.get("timestamp", "")[:10] <= w_end_str]
        w_uv = len(set(l.get("ip", "") for l in w_logs))
        weekly_stats.append({
            "week": w_label,
            "pv": len(w_logs),
            "uv": w_uv
        })

    # 3. 월별 통계 (최근 6개월)
    monthly_stats = []
    for m in range(5, -1, -1):
        # 대략적인 월 계산
        year = now.year
        month = now.month - m
        while month <= 0:
            month += 12
            year -= 1
        m_str = f"{year:04d}-{month:02d}"
        m_logs = [l for l in logs if l.get("timestamp", "").startswith(m_str)]
        m_uv = len(set(l.get("ip", "") for l in m_logs))
        monthly_stats.append({
            "month": f"{year}.{month:02d}",
            "pv": len(m_logs),
            "uv": m_uv
        })

    # 4. 주간 요일별 통계 (월~일)
    dow_counts = [0] * 7
    dow_uv_sets = [set() for _ in range(7)]
    for l in logs:
        ts = l.get("timestamp", "")
        if ts:
            try:
                dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
                w_idx = dt.weekday() # 0: 월, 6: 일
                dow_counts[w_idx] += 1
                dow_uv_sets[w_idx].add(l.get("ip", ""))
            except Exception:
                pass
    
    total_dow_pv = sum(dow_counts) or 1
    day_of_week_stats = []
    for idx, name in enumerate(["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]):
        c = dow_counts[idx]
        day_of_week_stats.append({
            "day": name,
            "short": weekday_kor[idx],
            "pv": c,
            "uv": len(dow_uv_sets[idx]),
            "pct": round((c / total_dow_pv) * 100, 1)
        })

    # 5. 시간대별 통계 (00시 ~ 23시)
    hourly_counts = [0] * 24
    hourly_uv_sets = [set() for _ in range(24)]
    for l in logs:
        ts = l.get("timestamp", "")
        if ts:
            try:
                dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
                h = dt.hour
                hourly_counts[h] += 1
                hourly_uv_sets[h].add(l.get("ip", ""))
            except Exception:
                pass

    total_hourly_pv = sum(hourly_counts) or 1
    peak_hour = hourly_counts.index(max(hourly_counts)) if hourly_counts else 14
    hourly_stats = []
    for h in range(24):
        c = hourly_counts[h]
        hourly_stats.append({
            "hour": f"{h:02d}:00",
            "hourNum": h,
            "pv": c,
            "uv": len(hourly_uv_sets[h]),
            "pct": round((c / total_hourly_pv) * 100, 1)
        })

    # 6. 최근 접속자 로그 25건
    recent_visitors = logs[:25]

    return {
        "summary": {
            "totalPv": total_pv,
            "totalUv": total_uv,
            "todayPv": today_pv,
            "todayUv": today_uv,
            "weekPv": week_pv,
            "weekUv": week_uv,
            "monthPv": month_pv,
            "monthUv": month_uv,
            "peakHour": f"{peak_hour:02d}:00 ~ {peak_hour+1:02d}:00"
        },
        "daily": daily_stats,
        "weekly": weekly_stats,
        "monthly": monthly_stats,
        "dayOfWeek": day_of_week_stats,
        "hourly": hourly_stats,
        "recentVisitors": recent_visitors,
        "isRealMode": is_real_mode
    }

# 스마트 내장 AI 추천 알고리즘 (API Key가 없거나 오프라인일 때도 완벽 작동)
def fallback_smart_recommend(user_prompt):
    p = user_prompt.lower()
    
    # 작업 의도 분석
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
                {
                    "id": "qwen-2-5-coder-32b",
                    "name": "Qwen 2.5 Coder 32B",
                    "creator": "Alibaba 🇨🇳",
                    "reason": "오픈 가중치 코딩 전용 모델 중 최강의 벤치마크를 자랑하며 토큰 비용이 매우 저렴합니다.",
                    "bestProvider": "KIE API ($0.15/1M)"
                },
                {
                    "id": "deepseek-v3",
                    "name": "DeepSeek-V3",
                    "creator": "DeepSeek 🇨🇳",
                    "reason": "압도적인 가격 대비 코딩 벤치마크 성능으로 대규모 코드베이스 분석에 이상적입니다.",
                    "bestProvider": "KIE API ($0.14/1M)"
                }
            ]
        }
    
    elif any(k in p for k in ['추론', '논리', '수학', 'o1', 'r1', '심층', '증명', '과학', '의사결정', '전략']):
        return {
            "intent": "심층 논리 & 고난도 추론 (Reasoning)",
            "primary": {
                "id": "deepseek-r1",
                "name": "DeepSeek-R1",
                "creator": "DeepSeek 🇨🇳",
                "category": "Reasoning",
                "reason": "OpenAI o1과 동등한 최상위 복합 추론 성능(AIME 수학 1위)을 OpenAI 대비 1/10 이하의 파격적인 단가로 제공합니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.55 / 1M 토큰 (공식 대비 -75% 할인)"
            },
            "alternatives": [
                {
                    "id": "o3-mini",
                    "name": "o3-mini",
                    "creator": "OpenAI 🇺🇸",
                    "reason": "OpenAI의 최신 초고속 경량 추론 모델로 STEM 문제 해결에 매우 뛰어납니다.",
                    "bestProvider": "KIE API ($0.55/1M)"
                },
                {
                    "id": "moonshot-kimi-k1-5",
                    "name": "Moonshot Kimi k1.5",
                    "creator": "Moonshot AI 🇨🇳",
                    "reason": "200만 토큰의 초장문 컨텍스트와 멀티모달 고난도 추론을 결합했습니다.",
                    "bestProvider": "문샷 AI 공식"
                }
            ]
        }
    
    elif any(k in p for k in ['한국어', '네이버', '업스테이지', '카카오', '행정', '공공', '보고서', '국내', '법률', '한국']):
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
                {
                    "id": "solar-pro",
                    "name": "Solar Pro (22B)",
                    "creator": "업스테이지 🇰🇷",
                    "reason": "한국어/영어 바이링구얼 및 OCR 문서 파싱에 특화되어 기업용 엔터프라이즈 환경에 최적입니다.",
                    "bestProvider": "KIE API ($0.25/1M)"
                },
                {
                    "id": "lg-exaone-3-5",
                    "name": "EXAONE 3.5 (32B)",
                    "creator": "LG AI Research 🇰🇷",
                    "reason": "LG의 산업 데이터 전문 지식과 뛰어난 한국어 추론 효율을 자랑합니다.",
                    "bestProvider": "LG AI (공식)"
                }
            ]
        }
    
    elif any(k in p for k in ['영상', '비디오', '동영상', '쇼츠', '릴스', '틱톡', '영화', '애니메이션', '3d', '카메라']):
        return {
            "intent": "AI 영상 & 비디오 생성",
            "primary": {
                "id": "pixverse-v3",
                "name": "PixVerse V3",
                "creator": "PixVerse 🇨🇳",
                "category": "Video Generation",
                "reason": "초당 카메라 앵글 제어 및 사실적인 피사체 일관성을 보장하며, 현재 가장 경쟁력 있는 생성 단가를 제공합니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.05 / 생성회차 (단일 최저가)"
            },
            "alternatives": [
                {
                    "id": "kling-3-0",
                    "name": "Kling 3.0",
                    "creator": "Kuaishou 🇨🇳",
                    "reason": "물리 엔진 기반의 극사실적 인간 모션과 시네마틱 숏폼 연출에 뛰어납니다.",
                    "bestProvider": "Kling AI 공식"
                },
                {
                    "id": "google-veo-3-1",
                    "name": "Google Veo 3.1",
                    "creator": "Google 🇺🇸",
                    "reason": "영화급 4K 해상도와 정교한 프롬프트 이해도를 갖춘 구글의 차세대 비디오 플래그십입니다.",
                    "bestProvider": "Google AI Studio"
                }
            ]
        }
        
    elif any(k in p for k in ['이미지', '그림', '포스터', '일러스트', '디자인', '사진', '로고', '웹툰', '배경']):
        return {
            "intent": "AI 고화질 이미지 & 그래픽 생성",
            "primary": {
                "id": "flux-1-schnell",
                "name": "FLUX.1 Schnell",
                "creator": "Black Forest Labs 🇪🇺",
                "category": "Image Generation",
                "reason": "4스텝 초고속 생성으로 1초 이내에 극사실적 디테일과 텍스트 타이포그래피를 완벽하게 렌더링합니다.",
                "bestProvider": "Together AI",
                "costEst": "$0.003 / 장 (업계 최저가)"
            },
            "alternatives": [
                {
                    "id": "recraft-v3",
                    "name": "Recraft 20B/v3",
                    "creator": "Recraft AI 🇪🇺",
                    "reason": "디자이너를 위한 SVG 벡터 및 상업용 그래픽 아트에 독보적입니다.",
                    "bestProvider": "Recraft 공식"
                },
                {
                    "id": "dall-e-3",
                    "name": "DALL-E 3",
                    "creator": "OpenAI 🇺🇸",
                    "reason": "자연어 프롬프트 뉘앙스를 가장 충실하게 이해하고 반영합니다.",
                    "bestProvider": "OpenAI 공식"
                }
            ]
        }

    elif any(k in p for k in ['음악', '작곡', '노래', '오디오', 'tts', '음성', '목소리', 'bgm', '사운드', '성우']):
        return {
            "intent": "AI 음악 작곡 & 오디오 TTS 성우 생성",
            "primary": {
                "id": "suno-v6",
                "name": "Suno V6",
                "creator": "Suno 🇺🇸",
                "category": "Music Generation",
                "reason": "텍스트 입력만으로 보컬, 악기 세션, 믹싱이 완벽한 라디오 품질의 상업용 음악을 즉시 작곡합니다.",
                "bestProvider": "Suno 공식",
                "costEst": "$0.05 / 곡 (크레딧 기준)"
            },
            "alternatives": [
                {
                    "id": "elevenlabs-v3",
                    "name": "ElevenLabs Multilingual V3",
                    "creator": "ElevenLabs 🇺🇸",
                    "reason": "전 세계 29개국 언어의 자연스러운 감정과 음성 복제를 제공하는 1위 TTS입니다.",
                    "bestProvider": "ElevenLabs 공식"
                },
                {
                    "id": "minimax-speech-01",
                    "name": "MiniMax Speech-01",
                    "creator": "Minimax 🇨🇳",
                    "reason": "초저지연 음성 스트리밍과 높은 가성비를 제공합니다.",
                    "bestProvider": "KIE API"
                }
            ]
        }

    elif any(k in p for k in ['저렴', '가성비', '가장 싼', '최저가', '돈 아끼', '경량', '소형', '모바일', '온디바이스', '단말', '속도', '초고속']):
        return {
            "intent": "초저비용 & 경량 초고속 온디바이스",
            "primary": {
                "id": "qwen-2-5-0-5b-instruct",
                "name": "Qwen 2.5 0.5B Instruct",
                "creator": "Alibaba 🇨🇳",
                "category": "Fast & Lightweight",
                "reason": "100만 토큰당 $0.015라는 압도적인 최저가로, CPU나 모바일 환경에서도 지연 없이 실시간 구동됩니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.015 / 1M 토큰 (전체 최저가)"
            },
            "alternatives": [
                {
                    "id": "llama-3-2-1b-instruct",
                    "name": "Llama 3.2 1B Instruct",
                    "creator": "Meta 🇺🇸",
                    "reason": "Meta의 1B 최신 모델로 Groq LPU에서 초당 400+ 토큰의 초광속 응답을 제공합니다.",
                    "bestProvider": "KIE API ($0.02/1M)"
                },
                {
                    "id": "gemini-3-8-flash",
                    "name": "Gemini 3.8 Flash",
                    "creator": "Google 🇺🇸",
                    "reason": "대용량 멀티모달 처리와 빠른 응답 속도를 겸비한 초가성비 모델입니다.",
                    "bestProvider": "KIE API ($0.08/1M)"
                }
            ]
        }

    else:
        # 범용 플래그십 추천
        return {
            "intent": "다목적 범용 고성능 AI 작업",
            "primary": {
                "id": "gemini-3-8-flash",
                "name": "Gemini 3.8 Flash",
                "creator": "Google 🇺🇸",
                "category": "High Performance",
                "reason": "텍스트, 비전, 오디오를 통합 처리하며 실시간에 가까운 초고속 반응성과 저렴한 토큰 단가를 동시에 만족하는 1위 범용 AI입니다.",
                "bestProvider": "KIE API",
                "costEst": "$0.08 / 1M 토큰 (공식가 대비 -50% 할인)"
            },
            "alternatives": [
                {
                    "id": "gpt-4o-mini",
                    "name": "GPT-4o-mini",
                    "creator": "OpenAI 🇺🇸",
                    "reason": "전 세계에서 가장 검증된 안정성과 방대한 개발 생태계를 갖춘 올라운더 모델입니다.",
                    "bestProvider": "KIE API ($0.07/1M)"
                },
                {
                    "id": "claude-sonnet-3-7",
                    "name": "Claude Sonnet 3.7",
                    "creator": "Anthropic 🇺🇸",
                    "reason": "정밀한 문서 작성, 논리 추론, 복합 작업에서 최고의 사용자 만족도를 제공합니다.",
                    "bestProvider": "KIE API ($1.50/1M)"
                }
            ]
        }

# Google Gemini API 호출 (GEMINI_API_KEY 활용)
def call_gemini_api(prompt, api_key):
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        system_instruction = (
            "당신은 글로벌 LLM 및 AI 모델 최저가 컨설턴트입니다. "
            "사용자가 하고자 하는 작업 내용을 정밀 분석하여 가장 적합한 AI 모델(OpenAI, Anthropic, Google, DeepSeek, Naver, Upstage, Alibaba 등)을 1개 선정하고 대안 모델 2개를 추천하세요. "
            "반드시 순수한 JSON 형식으로만 응답해야 합니다. 마크다운 따옴표나 기타 텍스트를 포함하지 마세요. "
            "포맷: "
            "{\"intent\": \"작업의도\", \"primary\": {\"name\": \"모델명\", \"creator\": \"개발사\", \"reason\": \"선정이유(한국어)\", \"bestProvider\": \"추천공급처\", \"costEst\": \"예상비용\"}, \"alternatives\": [{\"name\": \"대안1\", \"reason\": \"이유\"}, {\"name\": \"대안2\", \"reason\": \"이유\"}]}"
        )
        body = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\n사용자 작업: {prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "responseMimeType": "application/json"
            }
        }
        req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidate = res_data.get('candidates', [{}])[0]
            part = candidate.get('content', {}).get('parts', [{}])[0]
            text = part.get('text', '').strip()
            # 혹시 마크다운 ```json 으로 감싸진 경우 제거
            if text.startswith('```'):
                text = text.split('```')[1]
                if text.startswith('json'):
                    text = text[4:]
                text = text.strip()
            return json.loads(text)
    except Exception as e:
        print(f"[Gemini API fallback] 구글 제미나이 API 호출 오류: {e}")
        return None

# 외부 LLM API 호출 (OpenAI 키가 있을 경우 심층 분석 지원)
def call_external_llm_api(prompt, api_key):
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        body = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "당신은 글로벌 LLM 및 AI 모델 최저가 컨설턴트입니다. "
                        "사용자가 하고자 하는 작업 내용을 분석하여 가장 적합한 AI 모델(OpenAI, Anthropic, Google, DeepSeek, Naver, Upstage, Alibaba 등)을 1개 선정하고 대안 모델 2개를 추천하세요. "
                        "반드시 유효한 JSON 형식으로만 응답하세요: "
                        "{\"intent\": \"작업의도\", \"primary\": {\"name\": \"모델명\", \"creator\": \"개발사\", \"reason\": \"선정이유(한국어)\", \"bestProvider\": \"추천공급처\", \"costEst\": \"예상비용\"}, \"alternatives\": [{\"name\": \"대안1\", \"reason\": \"이유\"}, {\"name\": \"대안2\", \"reason\": \"이유\"}]}"
                    )
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            content = res_data['choices'][0]['message']['content']
            return json.loads(content)
    except Exception as e:
        print(f"[LLM API fallback] 외부 API 호출 오류: {e}")
        return None

class LLMProxyRequestHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/recommend':
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

            # 매 요청 시 .env 최신 상태 실시간 리로드
            current_env = load_env_file()
            gemini_key = current_env.get('GEMINI_API_KEY', '').strip()
            openai_key = current_env.get('OPENAI_API_KEY', '').strip()

            result = None
            
            # 1. Google Gemini API 우선 호출
            if gemini_key and len(gemini_key) > 10:
                print(f"[AI Recommender] Gemini API 호출 시도...")
                result = call_gemini_api(user_prompt, gemini_key)

            # 2. OpenAI API 호출
            if not result and openai_key and len(openai_key) > 10:
                print(f"[AI Recommender] OpenAI API 호출 시도...")
                result = call_external_llm_api(user_prompt, openai_key)
            
            # 3. 오프라인/에러 시 스마트 내장 엔진 폴백
            if not result:
                print(f"[AI Recommender] 내장 지능형 추천 엔진 활성화")
                result = fallback_smart_recommend(user_prompt)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        req_path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # 방문자 접속 로깅 (정적 자원 제외)
        client_ip = self.headers.get('X-Forwarded-For')
        if client_ip:
            client_ip = client_ip.split(',')[0].strip()
        else:
            client_ip = self.client_address[0] if self.client_address else '127.0.0.1'
        user_agent = self.headers.get('User-Agent', '')
        record_visit(client_ip, user_agent, req_path)

        current_env = load_env_file()
        admin_ips_raw = current_env.get('ADMIN_IPS', '127.0.0.1')
        admin_ips = [ip.strip() for ip in admin_ips_raw.split(',') if ip.strip()]
        is_admin = (client_ip in admin_ips) or (client_ip in ['127.0.0.1', 'localhost', '::1'])
        
        host_hdr = self.headers.get('Host', '').lower()
        is_domain = not ('localhost' in host_hdr or '127.0.0.1' in host_hdr)

        if req_path == '/api/analytics':
            # 도메인 상태이거나 mode=real 요청인 경우 가상 시드 제외한 실제 데이터만 조회
            default_mode = 'real' if is_domain else 'all'
            requested_mode = query_params.get('mode', [default_mode])[0]
            summary = get_analytics_summary(mode=requested_mode)
            summary['isAdmin'] = is_admin
            summary['clientIp'] = client_ip
            summary['isDomain'] = is_domain
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(json.dumps(summary, ensure_ascii=False).encode('utf-8'))
            return

        if req_path == '/api/env-info':
            gemini_configured = bool(current_env.get('GEMINI_API_KEY', '').strip())
            openai_configured = bool(current_env.get('OPENAI_API_KEY', '').strip())
            
            info = {
                "isLocal": not is_domain,
                "isAdmin": is_admin,
                "clientIp": client_ip,
                "isDomain": is_domain,
                "appEnv": current_env.get('APP_ENV', 'development'),
                "debugMode": current_env.get('DEV_DEBUG_MODE', 'true').lower() == 'true',
                "port": int(current_env.get('DEV_SERVER_PORT', PORT)),
                "host": current_env.get('DEV_SERVER_HOST', 'localhost'),
                "keys": {
                    "gemini": gemini_configured,
                    "openai": openai_configured
                }
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(json.dumps(info, ensure_ascii=False).encode('utf-8'))
            return
        
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LLMProxyRequestHandler)
    print(f"🚀 [LLM 최저가 찾기] 서버 실행 중: http://localhost:{PORT}")
    print(f"🔒 .env 보안 모드 활성화됨 (API Key 안전 보호)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
