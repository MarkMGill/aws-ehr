import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Prescription extends Model<InferAttributes<Prescription>, InferCreationAttributes<Prescription>> {
  declare id: string;
  declare patientId: string | null;
  declare medication: string;
  declare dosage: string;
  declare frequency: string;
  declare prescriber: string;
  declare status: string;
  declare createdAt: CreationOptional<Date>;
}

Prescription.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  patientId: { type: DataTypes.TEXT, allowNull: true, field: 'patient_id', references: { model: 'patients', key: 'id' } },
  medication: { type: DataTypes.TEXT, allowNull: false },
  dosage: { type: DataTypes.TEXT, allowNull: false },
  frequency: { type: DataTypes.TEXT, allowNull: false },
  prescriber: { type: DataTypes.TEXT, allowNull: false, field: 'prescriber_name' },
  status: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at', defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'prescriptions', modelName: 'Prescription' });
