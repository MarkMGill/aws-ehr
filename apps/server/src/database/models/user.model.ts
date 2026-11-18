import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare role: 'patient' | 'clinician' | 'admin';
  declare cognitoSub: string | null;
  declare patientId: string | null;
  declare createdAt: CreationOptional<Date>;
}

User.init({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  email: { type: DataTypes.TEXT, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.TEXT, allowNull: false, field: 'password_hash' },
  firstName: { type: DataTypes.TEXT, allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.TEXT, allowNull: false, field: 'last_name' },
  role: { type: DataTypes.TEXT, allowNull: false },
  cognitoSub: { type: DataTypes.TEXT, allowNull: true, unique: true, field: 'cognito_sub' },
  patientId: { type: DataTypes.TEXT, allowNull: true, field: 'patient_id', references: { model: 'patients', key: 'id' } },
  createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at', defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'users', modelName: 'User', defaultScope: { attributes: { exclude: ['passwordHash'] } } });
