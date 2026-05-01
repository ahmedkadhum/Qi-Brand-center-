#!/usr/bin/env python3
import http.server, socketserver, os, sys, functools
ROOT = "/Users/ahmed/Desktop/Qi brand Cnter "
PORT = int(os.environ.get("PORT", "8765"))
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    sys.stderr.write(f"Serving {ROOT} at http://127.0.0.1:{PORT}\n")
    sys.stderr.flush()
    httpd.serve_forever()
