#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.error
import os
import sys

BACKEND_URL = 'http://localhost:6789'

class ProxyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'public'), **kwargs)
    
    def do_GET(self):
        if self.path.startswith('/ping') or self.path.startswith('/helloWorld'):
            self.proxy_request()
        else:
            super().do_GET()
    
    def proxy_request(self):
        try:
            url = BACKEND_URL + self.path
            req = urllib.request.Request(url)
            
            for header in self.headers:
                if header.lower() not in ['host']:
                    req.add_header(header, self.headers[header])
            
            with urllib.request.urlopen(req, timeout=10) as response:
                self.send_response(response.status)
                
                for header, value in response.getheaders():
                    if header.lower() not in ['transfer-encoding', 'connection']:
                        self.send_header(header, value)
                
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error": "Proxy error", "message": "{str(e)}"}}'.encode())

def run(server_class=HTTPServer, handler_class=ProxyHTTPRequestHandler, port=3000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Server running at http://localhost:{port}/')
    print(f'Proxying API requests to {BACKEND_URL}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    port = 3000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run(port=port)
