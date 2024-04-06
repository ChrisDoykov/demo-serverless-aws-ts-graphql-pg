import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserCreationAttributes = Omit<User, "createdAt" | "id" | "updatedAt">;

export type UserModel = ModelStatic<Model<User, UserCreationAttributes>>;

export default (sequelize: Sequelize): UserModel => {
  const { STRING, DATE } = DataTypes;
  const User = sequelize.define("user", {
    name: {
      type: STRING,
      allowNull: false,
    },
    email: {
      type: STRING,
      validate: {
        isEmail: true,
      },
      allowNull: false,
      unique: true,
    },
    password: {
      type: STRING,
      allowNull: false,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  });
  return User;
};
