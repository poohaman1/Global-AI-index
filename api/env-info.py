# -*- coding: utf-8 -*-
from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        gemini_key = bool(os.environ.get('GEMINI_API_KEY', '').strip())
        openai_key = bool(os.environ.get('OPENAI_API_KEY', '').strip())

        # Vercel 프록시 헤더에서 클라이언트 실제 IP 추출
        raw_ip = self.headers.get('x-forwarded-for', '')
        client_ip = raw_ip.split(',')[0].strip() if raw_ip else self.headers.get('x-real-ip', '127.0.0.1')

        admin_ips_raw = os.environ.get('ADMIN_IPS', '61.36.35.11,127.0.0.1')
        admin_ips = [ip.strip() for ip in admin_ips_raw.split(',') if ip.strip()]
        is_admin = (client_ip in admin_ips) or (client_ip in ['127.0.0.1', 'localhost', '::1'])

        info = {
            "isLocal": False,
            "isAdmin": is_admin,
            "clientIp": client_ip,
            "isDomain": True,
            "appEnv": "production",
            "platform": "vercel",
            "keys": {
                "gemini": gemini_key,
                "openai": openai_key
            }
        }
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(info, ensure_ascii=False).encode('utf-8'))
