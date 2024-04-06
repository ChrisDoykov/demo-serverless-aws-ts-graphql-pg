import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

export type Record = {
  id: number;
  key: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
};

type RecordCreationAttributes = Omit<Record, "id" | "createdAt" | "updatedAt">;

export type RecordModel = ModelStatic<Model<Record, RecordCreationAttributes>>;

export default (sequelize: Sequelize): RecordModel => {
  const { STRING, DATE, TEXT } = DataTypes;
  const Record = sequelize.define("record", {
    key: {
      type: STRING,
      allowNull: false,
    },
    data: {
      type: TEXT,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  });
  return Record;
};
