# Windows ↔ WSL Firewall Helper

The script `scripts/manage-wsl-firewall.ps1` can be run from an elevated (Run as Administrator) PowerShell session on Windows to bring up WSL, show its IPv4 address, and make sure the Windows firewall is not blocking traffic between Windows and WSL.

## Usage

```powershell
cd <repo-root>
.\scripts\manage-wsl-firewall.ps1         # uses the default WSL distro
.\scripts\manage-wsl-firewall.ps1 -DistroName Ubuntu-24.04  # target a specific distro
```

What the script does:

1. Starts the target WSL distro (if it is not already running).
2. Reads the first global IPv4 address from inside WSL and prints it so you can reach services from Windows.
3. Finds the `vEthernet (WSL)` adapter and creates (or refreshes) inbound/outbound firewall rules named `Allow Windows <-> WSL (...)` that allow all traffic on that adapter.

To roll the change back later you can either delete those rules or disable them:

```powershell
Remove-NetFirewallRule -DisplayName "Allow Windows <-> WSL (Inbound)"
Remove-NetFirewallRule -DisplayName "Allow Windows <-> WSL (Outbound)"
```

> Note: Because the firewall rules reference the `vEthernet (WSL)` adapter, they automatically stay aligned with the current WSL virtual network even if its IP range changes.
