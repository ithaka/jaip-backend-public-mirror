export interface Services {
  database: {
    connect: (app: FastifyInstance) => Promise<void>;
  };
}
