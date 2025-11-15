#requires -RunAsAdministrator
<#!
.SYNOPSIS
    Ensures WSL is running, reports its IPv4 address, and opens the Windows firewall between Windows and WSL.
.DESCRIPTION
    Launches the specified (or default) WSL distribution, retrieves the first global IPv4 address from inside WSL,
    locates the "vEthernet (WSL)" adapter, and adds inbound/outbound firewall rules that allow all traffic over that interface.
.PARAMETER DistroName
    Optional WSL distribution name (as returned by `wsl -l`). When omitted the default distro is used.
#>
[CmdletBinding()]
param (
    [string]$DistroName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-WSLCommand {
    param (
        [Parameter(Mandatory)][string]$Command,
        [string]$DistroName
    )

    $args = @()
    if ($DistroName) {
        $args += '-d'
        $args += $DistroName
    }
    $args += 'bash'
    $args += '-lc'
    $args += $Command

    $output = & wsl.exe @args
    if ($LASTEXITCODE -ne 0) {
        throw "wsl.exe exited with code $LASTEXITCODE while running '$Command'"
    }
    return $output
}

function Ensure-WSLRunning {
    param([string]$DistroName)
    Write-Verbose 'Starting WSL (if not already running)...'
    Invoke-WSLCommand -DistroName $DistroName -Command 'true' | Out-Null
}

function Get-WSLIPv4Address {
    param([string]$DistroName)
    $command = "ip -o -4 addr show scope global | head -n1 | awk '{print `$4}' | cut -d/ -f1"
    $ip = Invoke-WSLCommand -DistroName $DistroName -Command $command | Select-Object -First 1
    $ip = $ip.Trim()
    if (-not $ip) {
        throw 'Failed to read an IPv4 address from WSL. Ensure the distro has networking enabled.'
    }
    return $ip
}

function Get-WSLInterfaceAlias {
    $adapter = Get-NetAdapter -IncludeHidden |
        Where-Object { $_.Name -like '*WSL*' -or $_.InterfaceDescription -like '*WSL*' } |
        Sort-Object Status -Descending |
        Select-Object -First 1

    if (-not $adapter) {
        throw 'Could not find the vEthernet (WSL) adapter. Launch WSL at least once and try again.'
    }

    return $adapter.Name
}

function Ensure-FirewallRule {
    param (
        [Parameter(Mandatory)][ValidateSet('Inbound','Outbound')][string]$Direction,
        [Parameter(Mandatory)][string]$InterfaceAlias
    )

    $ruleName = "Allow Windows <-> WSL ($Direction)"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

    if ($existing) {
        Set-NetFirewallRule -InputObject $existing -Enabled True -Direction $Direction -Action Allow -Profile Any -InterfaceAlias $InterfaceAlias | Out-Null
    } else {
        New-NetFirewallRule -DisplayName $ruleName -Direction $Direction -InterfaceAlias $InterfaceAlias -Profile Any -Action Allow | Out-Null
    }

    return $ruleName
}

Ensure-WSLRunning -DistroName $DistroName
$wslIp = Get-WSLIPv4Address -DistroName $DistroName
$wslInterface = Get-WSLInterfaceAlias

$rules = @(
    Ensure-FirewallRule -Direction 'Inbound' -InterfaceAlias $wslInterface,
    Ensure-FirewallRule -Direction 'Outbound' -InterfaceAlias $wslInterface
)

Write-Host "WSL IPv4 address: $wslIp"
Write-Host "Firewall rules updated for interface '$wslInterface':"
$rules | ForEach-Object { Write-Host "  - $_" }

Write-Host 'Windows <-> WSL traffic is now allowed in both directions.'
