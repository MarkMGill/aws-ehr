import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class BillingRecord extends Model<InferAttributes<BillingRecord>, InferCreationAttributes<BillingRecord>> {
  declare id: string;
  declare patientId: string | null;
  declare service: string;
  declare amount: string | number;
  declare status: string;
  declare dueDate: string;
  declare createdAt: CreationOptional<Date>;
}

BillingRecord.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  patientId: { type: DataTypes.TEXT, allowNull: true, field: 'patient_id', references: { model: 'patients', key: 'id' } },
  service: { type: DataTypes.TEXT, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.TEXT, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'due_date' },
  createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at', defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'billing_records', modelName: 'BillingRecord' });
