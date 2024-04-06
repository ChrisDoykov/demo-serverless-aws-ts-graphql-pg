import pg from "pg";
import { ConnectionError, Sequelize } from "sequelize";

import { env, isTest } from "src/libs";
import userModel, { UserModel } from "src/database/models/user";
import recordModel, { RecordModel } from "src/database/models/record";
import trafficDataModel, {
  TrafficDataModel,
} from "src/database/models/trafficData";

export interface IDatabaseAccessorContext {
  User: UserModel;
  Record: RecordModel;
  TrafficData: TrafficDataModel;
}

class DatabaseConnector implements IDatabaseAccessorContext {
  private static instance: DatabaseConnector;
  private static connected: boolean = false;

  User: UserModel | null = null;
  Record: RecordModel | null = null;
  TrafficData: TrafficDataModel | null = null;

  private constructor() {}

  private async connect(): Promise<void> {
    if (!DatabaseConnector.connected) {
      const sequelize = new Sequelize(
        isTest ? env("POSTGRES_URL_TEST") : env("POSTGRES_URL"),
        {
          dialectModule: pg,
          dialectOptions: {
            ssl: isTest
              ? false
              : {
                  require: true,
                  rejectUnauthorized: false,
                },
          },
          pool: {
            /*
             * From the Sequelize docs:
             * Ideally you want to choose a `max` number where this holds true:
             * max * EXPECTED_MAX_CONCURRENT_LAMBDA_INVOCATIONS < MAX_ALLOWED_DATABASE_CONNECTIONS * 0.8
             */
            max: 2,
            /*
             * Set this value to 0 so connection pool eviction logic eventually cleans up all connections
             * in the event of a Lambda function timeout.
             */
            min: 0,
            /*
             * Set this value to 0 so connections are eligible for cleanup immediately after they're
             * returned to the pool.
             */
            idle: 0,
            // Choose a small enough value that fails fast if a connection takes too long to be established.
            acquire: 3000,
          },
        }
      );

      try {
        // Associate the models
        this.User = userModel(sequelize);
        this.Record = recordModel(sequelize);
        this.TrafficData = trafficDataModel(sequelize);

        // Sync the db
        await sequelize.sync({ force: isTest });

        DatabaseConnector.connected = true;
      } catch (error) {
        console.error("Unable to connect to the database:", error);

        // Reset to force a connection retry later
        DatabaseConnector.connected = false;
        throw new ConnectionError(error);
      }
    }
  }

  public static async getInstance(): Promise<DatabaseConnector> {
    if (!DatabaseConnector.instance)
      DatabaseConnector.instance = new DatabaseConnector();

    await DatabaseConnector.instance.connect();

    return DatabaseConnector.instance;
  }
}

export default DatabaseConnector;
