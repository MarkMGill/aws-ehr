import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Patient extends Model<InferAttributes<Patient>, InferCreationAttributes<Patient>> {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare dob: string;
  declare mrn: string;
  declare status: string;
  declare createdAt: CreationOptional<Date>;
}

Patient.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  firstName: { type: DataTypes.TEXT, allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.TEXT, allowNull: false, field: 'last_name' },
  dob: { type: DataTypes.DATEONLY, allowNull: false },
  mrn: { type: DataTypes.TEXT, allowNull: false, unique: true },
  status: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at', defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'patients', modelName: 'Patient' });
