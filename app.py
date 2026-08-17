import http.server
import socketserver
import webbrowser
import threading
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serveris paleistas adresu: http://localhost:{PORT}")
        print("Norėdami sustabdyti serverį, paspauskite Ctrl+C terminale.")
        httpd.serve_forever()

def open_browser():
    # Palaukiame sekundę, kad serveris spėtų pasileisti
    import time
    time.sleep(1)
    url = f"http://localhost:{PORT}"
    print(f"Atidaroma naršyklė: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    # Nustatome darbinį katalogą į šio failo vietą
    os.chdir(DIRECTORY)
    
    # Paleidžiame serverį atskiroje gijoje, kad galėtume atidaryti naršyklę
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Atidarome naršyklę
    open_browser()
    
    # Laikome pagrindinę giją gyvą
    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServeris sustabdytas.")
        sys.exit(0)
