import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Document extends Model<InferAttributes<Document>, InferCreationAttributes<Document>> {
  declare id: string;
  declare patientId: string | null;
  declare name: string;
  declare category: string;
  declare s3Key: string;
  declare uploadedAt: CreationOptional<Date>;
}

Document.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  patientId: { type: DataTypes.TEXT, allowNull: true, field: 'patient_id', references: { model: 'patients', key: 'id' } },
  name: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.TEXT, allowNull: false },
  s3Key: { type: DataTypes.TEXT, allowNull: false, field: 's3_key' },
  uploadedAt: { type: DataTypes.DATE, allowNull: true, field: 'uploaded_at', defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'documents', modelName: 'Document' });
