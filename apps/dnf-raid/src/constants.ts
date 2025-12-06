export const DNF_SERVERS = [
  {id: "cain", name: "카인"},
  {id: "diregie", name: "디레지에"},
  {id: "siroco", name: "시로코"},
  {id: "prey", name: "프레이"},
  {id: "casillas", name: "카시야스"},
  {id: "hilder", name: "힐더"},
  {id: "anton", name: "안톤"},
  {id: "bakal", name: "바칼"},
] as const;

export type DnfServerId = (typeof DNF_SERVERS)[number]["id"];

export const serverNameMap: Record<string, string> = DNF_SERVERS.reduce<Record<string, string>>(
  (acc, server) => {
    acc[server.id] = server.name;
    return acc;
  },
  {}
);

export function getServerName(serverId: string): string {
  return serverNameMap[serverId] ?? serverId;
}

export const DIREGIE_MIN_FAME = 63000;

export function isDiregieRaid(name?: string | null): boolean {
  if (!name) return false;
  return /디레지에|diregie/i.test(name);
}
