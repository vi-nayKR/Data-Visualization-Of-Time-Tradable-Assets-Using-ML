$ErrorActionPreference = 'Stop'
$deadline = (Get-Date).AddSeconds(60)
do {
    $state = ssh -o BatchMode=yes -o ConnectTimeout=5 medha-storage systemctl is-active cloudflared
    if ($LASTEXITCODE -eq 0 -and $state -eq 'active') { break }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)
try {
    if ($state -ne 'active') { throw 'Tunnel did not finish restarting' }
    foreach ($url in @('https://stock-api.medhainnovation.com/health', 'https://medhainnovation.com', 'https://api.medhainnovation.com/health', 'https://admin.medhainnovation.com')) {
        $code = curl.exe -sS --max-time 20 -o NUL -w '%{http_code}' $url
        Write-Output "$url $code"
        if ($LASTEXITCODE -ne 0 -or $code -ne '200') { throw "HTTP check failed: $url" }
    }
    foreach ($hostName in @('medha-storage', 'medha-worker')) {
        ssh -o BatchMode=yes -o ConnectTimeout=15 $hostName hostname
        if ($LASTEXITCODE -ne 0) { throw "SSH check failed: $hostName" }
    }
    ssh medha-storage 'if sudo systemctl is-active --quiet $(sudo cat /var/lib/stock-api-deploy/rollback-timer); then sudo systemctl stop $(sudo cat /var/lib/stock-api-deploy/rollback-timer); fi'
    if ($LASTEXITCODE -ne 0) { throw 'Could not cancel rollback watchdog' }
} catch {
    ssh medha-storage 'sudo bash /var/lib/stock-api-deploy/rollback.sh'
    # The server watchdog still restores the tunnel if SSH is unreachable.
    throw
}
