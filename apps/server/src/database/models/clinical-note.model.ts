import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class ClinicalNote extends Model<InferAttributes<ClinicalNote>, InferCreationAttributes<ClinicalNote>> {
  declare id: string;
  declare patientId: string | null;
  declare authorId: string | null;
  declare title: string;
  declare body: string;
  declare createdAt: CreationOptional<Date>;
}

ClinicalNote.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  patientId: { type: DataTypes.TEXT, allowNull: true, field: 'patient_id', references: { model: 'patients', key: 'id' } },
  authorId: { type: DataTypes.TEXT, allowNull: true, field: 'author_id', references: { model: 'users', key: 'id' } },
  title: { type: DataTypes.TEXT, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at', defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'clinical_notes', modelName: 'ClinicalNote' });
