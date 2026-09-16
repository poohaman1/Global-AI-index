# -*- coding: utf-8 -*-
from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

TMP_LOG_FILE = Path('/tmp/analytics_log.json')

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

def record_vercel_visit(ip, ua, path):
    logs = []
    if TMP_LOG_FILE.exists():
        try:
            with open(TMP_LOG_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except Exception:
            logs = []

    parsed = parse_user_agent(ua)
    masked_ip = ".".join(ip.split(".")[:3]) + ".*" if "." in ip else "127.0.0.*"
    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ip": ip,
        "masked_ip": masked_ip,
        "browser": parsed["browser"],
        "os": parsed["os"],
        "device": parsed["device"],
        "path": path,
        "is_seed": False
    }
    logs.insert(0, entry)
    if len(logs) > 1000:
        logs = logs[:1000]

    try:
        with open(TMP_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False)
    except Exception:
        pass

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        raw_ip = self.headers.get('x-forwarded-for', '')
        client_ip = raw_ip.split(',')[0].strip() if raw_ip else self.headers.get('x-real-ip', '127.0.0.1')
        user_agent = self.headers.get('user-agent', '')

        admin_ips_raw = os.environ.get('ADMIN_IPS', '127.0.0.1')
        admin_ips = [ip.strip() for ip in admin_ips_raw.split(',') if ip.strip()]
        is_admin = (client_ip in admin_ips) or (client_ip in ['127.0.0.1', 'localhost', '::1'])

        # 도메인 접속 시에는 실제 접속 로그만 기록 및 집계
        record_vercel_visit(client_ip, user_agent, '/')

        if not is_admin:
            self.send_response(403)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "접속자 통계 열람 권한이 없습니다 (관리자 IP 제한)"}, ensure_ascii=False).encode('utf-8'))
            return

        logs = []
        if TMP_LOG_FILE.exists():
            try:
                with open(TMP_LOG_FILE, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except Exception:
                logs = []

        # 실제 접속 데이터만(is_seed == False) 필터링
        real_logs = [l for l in logs if l.get('is_seed') is False]

        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        week_start_str = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
        month_start_str = now.strftime("%Y-%m-01")

        total_pv = len(real_logs)
        unique_ips = set(l.get("ip", "") for l in real_logs)
        total_uv = len(unique_ips)

        today_logs = [l for l in real_logs if l.get("timestamp", "").startswith(today_str)]
        today_pv = len(today_logs)
        today_uv = len(set(l.get("ip", "") for l in today_logs))

        week_logs = [l for l in real_logs if l.get("timestamp", "")[:10] >= week_start_str]
        week_pv = len(week_logs)
        week_uv = len(set(l.get("ip", "") for l in week_logs))

        month_logs = [l for l in real_logs if l.get("timestamp", "")[:10] >= month_start_str]
        month_pv = len(month_logs)
        month_uv = len(set(l.get("ip", "") for l in month_logs))

        weekday_kor = ["월", "화", "수", "목", "금", "토", "일"]
        daily_stats = []
        for i in range(13, -1, -1):
            day_dt = now - timedelta(days=i)
            d_str = day_dt.strftime("%Y-%m-%d")
            d_label = day_dt.strftime("%m.%d") + f"({weekday_kor[day_dt.weekday()]})"
            d_logs = [l for l in real_logs if l.get("timestamp", "").startswith(d_str)]
            daily_stats.append({
                "date": d_str,
                "label": d_label,
                "pv": len(d_logs),
                "uv": len(set(l.get("ip", "") for l in d_logs))
            })

        weekly_stats = []
        for w in range(7, -1, -1):
            w_end = now - timedelta(weeks=w)
            w_start = w_end - timedelta(days=w_end.weekday())
            w_start_str = w_start.strftime("%Y-%m-%d")
            w_end_str = (w_start + timedelta(days=6)).strftime("%Y-%m-%d")
            w_label = f"{w_start.strftime('%m.%d')}~{(w_start + timedelta(days=6)).strftime('%m.%d')}"
            w_logs = [l for l in real_logs if w_start_str <= l.get("timestamp", "")[:10] <= w_end_str]
            weekly_stats.append({
                "week": w_label,
                "pv": len(w_logs),
                "uv": len(set(l.get("ip", "") for l in w_logs))
            })

        monthly_stats = []
        for m in range(5, -1, -1):
            year = now.year
            month = now.month - m
            while month <= 0:
                month += 12
                year -= 1
            m_str = f"{year:04d}-{month:02d}"
            m_logs = [l for l in real_logs if l.get("timestamp", "").startswith(m_str)]
            monthly_stats.append({
                "month": f"{year}.{month:02d}",
                "pv": len(m_logs),
                "uv": len(set(l.get("ip", "") for l in m_logs))
            })

        dow_counts = [0] * 7
        dow_uv_sets = [set() for _ in range(7)]
        for l in real_logs:
            ts = l.get("timestamp", "")
            if ts:
                try:
                    dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
                    w_idx = dt.weekday()
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

        hourly_counts = [0] * 24
        hourly_uv_sets = [set() for _ in range(24)]
        for l in real_logs:
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
        peak_hour = hourly_counts.index(max(hourly_counts)) if (hourly_counts and max(hourly_counts) > 0) else 14
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

        result = {
            "summary": {
                "totalPv": total_pv,
                "totalUv": total_uv,
                "todayPv": today_pv,
                "todayUv": today_uv,
                "weekPv": week_pv,
                "weekUv": week_uv,
                "monthPv": month_pv,
                "monthUv": month_uv,
                "peakHour": f"{peak_hour:02d}:00 ~ {peak_hour+1:02d}:00" if total_pv > 0 else "-"
            },
            "daily": daily_stats,
            "weekly": weekly_stats,
            "monthly": monthly_stats,
            "dayOfWeek": day_of_week_stats,
            "hourly": hourly_stats,
            "recentVisitors": real_logs[:25],
            "isAdmin": is_admin,
            "clientIp": client_ip,
            "isDomainReal": True
        }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
