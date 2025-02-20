export interface Services {
  database: {
    connect: (app: FastifyInstance) => Promise<void>;
  };
}

export interface JSTORInstanceError {
  error: string;
}
export interface JSTORInstance {
  actionType: string;
  app: string;
  appGroupName: string | null;
  asgName: string | null;
  countryId: number;
  healthCheckUrl: string;
  homePageUrl: string;
  hostName: string;
  instanceId: null;
  ipAddr: string;
  isCoordinatingDiscoveryServer: boolean;
  lastDirtyTimestamp: string;
  lastUpdatedTimestamp: string;
  overridenStatus: string;
  secureHealthCheckUrl: string;
  sid: string;
  status: string;
  statusPageUrl: string;
}
