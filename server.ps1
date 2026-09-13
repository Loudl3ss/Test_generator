[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

param (
    [int]$Port = 8000,
    [string]$Root = $PSScriptRoot
)

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

# Rasti laisvą prievadą, jei 8000 užimtas
function Get-AvailablePort([int]$startPort) {
    for ($p = $startPort; $p -lt ($startPort + 20); $p++) {
        try {
            $tcpListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $p)
            $tcpListener.Start()
            $tcpListener.Stop()
            return $p
        } catch {
            # Užimtas, bandom sekantį
        }
    }
    return $startPort
}

$Port = Get-AvailablePort $Port
$url = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
try {
    $listener.Prefixes.Add($url)
    $listener.Start()
} catch {
    $url = "http://127.0.0.1:$Port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  InfoQuiz v2.0 serveris sėkmingai paleistas!" -ForegroundColor Green
Write-Host "  Adresas: $url" -ForegroundColor White
Write-Host "  Atidaroma interneto naršyklė..." -ForegroundColor Gray
Write-Host "  DĖMESIO: Neuždarykite šio lango, kol naudojatės!" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

# Atidaryti numatytąją naršyklę
Start-Process $url

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($rawPath)) {
            $rawPath = "index.html"
        }

        # Apsauga nuo path traversal
        $cleanPath = [System.Uri]::UnescapeDataString($rawPath).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $cleanPath = $cleanPath -replace '\.\.+', ''
        $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $cleanPath))

        if ($fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $response.ContentType = $mime
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    # Nutrauktas arba sustabdytas
} finally {
    if ($listener -ne $null) {
        $listener.Stop()
        $listener.Close()
    }
}
