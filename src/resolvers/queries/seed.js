// Built-ins
const fs = require("fs");
const path = require("path");

// Postgres and Sequelize
const pg = require("pg");
const { Sequelize, DataTypes } = require("sequelize");

// For parsing our data
const csv = require("csv-parser");

const trafficDataModel = (sequelize) => {
  const { STRING, INTEGER, DOUBLE } = DataTypes;
  const TrafficData = sequelize.define("trafficData", {
    Count_point_id: INTEGER,
    Year: INTEGER,
    Region_id: INTEGER,
    Region_name: STRING,
    Region_ons_code: STRING,
    Local_authority_id: INTEGER,
    Local_authority_name: STRING,
    Local_authority_code: STRING,
    Road_name: STRING,
    Road_category: STRING,
    Road_type: STRING,
    Start_junction_road_name: STRING,
    End_junction_road_name: STRING,
    Easting: INTEGER,
    Northing: INTEGER,
    Latitude: DOUBLE,
    Longitude: DOUBLE,
    Link_length_km: DOUBLE,
    Link_length_miles: DOUBLE,
    Estimation_method: STRING,
    Estimation_method_detailed: STRING,
    direction_of_travel: STRING,
    Pedal_cycles: INTEGER,
    Two_wheeled_motor_vehicles: INTEGER,
    Cars_and_taxis: INTEGER,
    Buses_and_coaches: INTEGER,
    LGVs: INTEGER,
    HGVs_2_rigid_axle: INTEGER,
    HGVs_3_rigid_axle: INTEGER,
    HGVs_4_or_more_rigid_axle: INTEGER,
    HGVs_3_or_4_articulated_axle: INTEGER,
    HGVs_5_articulated_axle: INTEGER,
    HGVs_6_articulated_axle: INTEGER,
    All_HGVs: INTEGER,
    All_motor_vehicles: INTEGER,
  });
  return TrafficData;
};

(async () => {
  // Ingest the local CSV
  const filePath = path.join(
    __dirname,
    "./dft_traffic_counts_aadf_by_direction.csv"
  );

  // Connect to DB
  const sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialectModule: pg,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  try {
    const TrafficData = trafficDataModel(sequelize);

    // Sync the db
    await sequelize.sync({ force: false });

    // Read the data from the ingested CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          // Create a new record in your Sequelize model for each row in the CSV
          const modelData = {};
          Object.keys({
            Count_point_id: 0,
            Year: 0,
            Region_id: 0,
            Region_name: "",
            Region_ons_code: 0,
            Local_authority_id: 0,
            Local_authority_name: "",
            Local_authority_code: "",
            Road_name: "",
            Road_category: "",
            Road_type: "",
            Start_junction_road_name: "",
            End_junction_road_name: "",
            Easting: 0,
            Northing: 0,
            Latitude: 0.0,
            Longitude: 0.0,
            Link_length_km: 0.0,
            Link_length_miles: 0.0,
            Estimation_method: "",
            Estimation_method_detailed: "",
            direction_of_travel: "",
            Pedal_cycles: 0,
            Two_wheeled_motor_vehicles: 0,
            Cars_and_taxis: 0,
            Buses_and_coaches: 0,
            LGVs: 0,
            HGVs_2_rigid_axle: 0,
            HGVs_3_rigid_axle: 0,
            HGVs_4_or_more_rigid_axle: 0,
            HGVs_3_or_4_articulated_axle: 0,
            HGVs_5_articulated_axle: 0,
            HGVs_6_articulated_axle: 0,
            All_HGVs: 0,
            All_motor_vehicles: 0,
          }).map((key) => {
            modelData[key] = row[key];
          });

          // Store the data
          await TrafficData.create(modelData);
        } catch (error) {
          console.error("Failed to insert row with data", row, error);
        }
      })
      .on("end", () => {
        console.log("CSV file successfully processed.");
      });
  } catch (error) {
    console.error("Something went wrong", error);
  } finally {
    // Ensure we close the connection
    await sequelize.close();
  }
})();
