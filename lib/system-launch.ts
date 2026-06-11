export type ExternalSystemId = "iwaste" | "corporate" | "sip";

export type SystemLaunchConfig = {
  id: ExternalSystemId;
  label: string;
  loginUrl: string;
  dashboardUrl: string;
};

export const systemLaunchConfigs: Record<ExternalSystemId, SystemLaunchConfig> =
  {
    iwaste: {
      id: "iwaste",
      label: "iWaste",
      loginUrl: "https://iwaste.adudor.com/login",
      dashboardUrl: "https://iwaste.adudor.com/home",
    },
    corporate: {
      id: "corporate",
      label: "Corporate",
      loginUrl: "https://corporate.adudor.com",
      dashboardUrl: "https://corporate.adudor.com",
    },
    sip: {
      id: "sip",
      label: "SIP",
      loginUrl: "https://sip.adudor.com/login",
      dashboardUrl: "https://sip.adudor.com/",
    },
  };

export function isExternalSystemId(value: string): value is ExternalSystemId {
  return value in systemLaunchConfigs;
}

export function getSystemLaunchConfig(
  system: ExternalSystemId
): SystemLaunchConfig {
  return systemLaunchConfigs[system];
}
