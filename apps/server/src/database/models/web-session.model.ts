import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class WebSession extends Model<InferAttributes<WebSession>, InferCreationAttributes<WebSession>> {
  declare id: string;
  declare kind: 'login' | 'session';
  declare payload: string;
  declare expiresAt: Date;
}

WebSession.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  kind: { type: DataTypes.TEXT, allowNull: false },
  payload: { type: DataTypes.TEXT, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
}, { sequelize, tableName: 'web_sessions', modelName: 'WebSession' });
