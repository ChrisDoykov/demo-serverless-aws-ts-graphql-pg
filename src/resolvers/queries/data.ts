// Sequelize
import { Op } from "sequelize";

// Utils
import { not } from "ramda";
import { json2csv } from "json-2-csv";
import { GraphQLError } from "graphql";

// Models and types
import { Record } from "src/database/models/record";
import { QueryGetTrafficDataBetweenYearsArgs } from "src/generated/graphql";
import { Context } from "src/functions/graphql/context";

export async function getTrafficDataBetweenYears(
  _,
  {
    fromYear = 2016,
    toYear = new Date().getFullYear(),
  }: QueryGetTrafficDataBetweenYearsArgs,
  { db, isAuth }: Context
): Promise<Record> {
  if (not(isAuth))
    throw new GraphQLError(`Please authenticate first!`, {
      extensions: { code: "NO_AUTH" },
    });

  // Each year range maps to exactly one key
  const KEY = `traffic-data-${fromYear}-${toYear}.csv`;

  // Initially try and check if we already have this data generated
  // If we do -> fetch the record and return it
  const record = await db.Record.findOne({
    where: {
      key: KEY,
    },
  });

  if (record) return record.dataValues;

  // If we don't -> fetch JSON from Postgres
  const trafficData = await db.TrafficData.findAll({
    where: {
      Year: {
        [Op.and]: {
          [Op.gte]: fromYear,
          [Op.lte]: toYear,
        },
      },
    },
  });

  // Convert to CSV
  // Deep clone is required to remove other fields (otherwise we get dataValues.id, etc.)
  const csv = json2csv(JSON.parse(JSON.stringify(trafficData)));

  // Store in db
  const newRecord = await db.Record.create({
    key: KEY,
    data: csv,
  });

  return newRecord.dataValues;
}
