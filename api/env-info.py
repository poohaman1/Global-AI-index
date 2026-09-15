# -*- coding: utf-8 -*-
from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        gemini_key = bool(os.environ.get('GEMINI_API_KEY', '').strip())
        openai_key = bool(os.environ.get('OPENAI_API_KEY', '').strip())
        info = {
            "isLocal": False,
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
        self.end_headers()
        self.wfile.write(json.dumps(info, ensure_ascii=False).encode('utf-8'))
