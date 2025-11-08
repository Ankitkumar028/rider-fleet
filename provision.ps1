Param(
  [string]$Namespace = "fleet",
  [string]$BackendImage = "rider-fleet-backend:local",
  [string]$FrontendImage = "rider-fleet-frontend:local"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Exec($cmd) {
  Write-Host "> $cmd" -ForegroundColor DarkGray
  $out = Invoke-Expression $cmd
  if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
    throw "Command failed: $cmd"
  }
  return $out
}

Write-Section "Checking tools"
$null = Exec "kubectl version --client --output=yaml | Out-Null"
$null = Exec "docker version --format '{{.Server.Version}}' | Out-Null"

Write-Section "Creating/ensuring namespace: $Namespace"
Exec "kubectl apply -f k8s/namespace.yaml"

Write-Section "Deploying MongoDB (Service, StatefulSet)"
Exec "kubectl -n $Namespace apply -f k8s/mongo/service.yaml"
Exec "kubectl -n $Namespace apply -f k8s/mongo/statefulset.yaml"

Write-Section "Building Docker images"
Exec "docker build -t $BackendImage ./backend"
Exec "docker build -t $FrontendImage ./frontend"

Write-Section "Applying Backend manifests"
Exec "kubectl -n $Namespace apply -f k8s/backend/deployment.yaml"
Exec "kubectl -n $Namespace apply -f k8s/backend/service.yaml"

Write-Section "Applying Frontend manifests"
Exec "kubectl -n $Namespace apply -f k8s/frontend/deployment.yaml"
Exec "kubectl -n $Namespace apply -f k8s/frontend/service.yaml"

Write-Section "Waiting for rollouts"
# MongoDB StatefulSet (name assumed 'mongodb')
try { Exec "kubectl -n $Namespace rollout status statefulset/mongodb --timeout=180s" } catch { Write-Host "MongoDB rollout wait skipped/failed (continuing): $_" -ForegroundColor Yellow }
# Backend
Exec "kubectl -n $Namespace rollout status deploy/rider-backend --timeout=180s"
# Frontend
Exec "kubectl -n $Namespace rollout status deploy/rider-frontend --timeout=180s"

Write-Section "Service summary"
$frontendPort = Exec "kubectl -n $Namespace get svc rider-frontend -o jsonpath='{.spec.ports[0].nodePort}'"
if (-not $frontendPort) { $frontendPort = "30080" }
$backendClusterURL = "http://rider-backend.$Namespace.svc.cluster.local:4000/api/health"
$frontendURL = "http://localhost:$frontendPort"

Write-Host "Frontend: $frontendURL" -ForegroundColor Green
Write-Host "Backend (cluster internal): $backendClusterURL" -ForegroundColor Green
Write-Host "Backend (via frontend proxy): $frontendURL/api/health" -ForegroundColor Green

Write-Section "Done"
