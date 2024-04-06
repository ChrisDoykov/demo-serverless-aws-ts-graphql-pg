import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

export type TrafficData = {
  id: number;
  Count_point_id: number;
  Year: number;
  Region_id: number;
  Region_name: string;
  Region_ons_code: string;
  Local_authority_id: number;
  Local_authority_name: string;
  Local_authority_code: string;
  Road_name: string;
  Road_category: string;
  Road_type: string;
  Start_junction_road_name: string;
  End_junction_road_name: string;
  Easting: number;
  Northing: number;
  Latitude: number;
  Longitude: number;
  Link_length_km: number;
  Link_length_miles: number;
  Estimation_method: string;
  Estimation_method_detailed: string;
  direction_of_travel: string;
  Pedal_cycles: number;
  Two_wheeled_motor_vehicles: number;
  Cars_and_taxis: number;
  Buses_and_coaches: number;
  LGVs: number;
  HGVs_2_rigid_axle: number;
  HGVs_3_rigid_axle: number;
  HGVs_4_or_more_rigid_axle: number;
  HGVs_3_or_4_articulated_axle: number;
  HGVs_5_articulated_axle: number;
  HGVs_6_articulated_axle: number;
  All_HGVs: number;
  All_motor_vehicles: number;
};

type TrafficDataCreationAttributes = Omit<TrafficData, "id">;

export type TrafficDataModel = ModelStatic<
  Model<TrafficData, TrafficDataCreationAttributes>
>;

export default (sequelize: Sequelize): TrafficDataModel => {
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
