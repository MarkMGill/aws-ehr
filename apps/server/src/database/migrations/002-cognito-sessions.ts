import { DataTypes, Op, type QueryInterface } from 'sequelize';

export async function up({ context: query }: { context: QueryInterface }) {
  const columns = await query.describeTable('users');
  await query.sequelize.transaction(async (transaction) => {
    if (!columns.cognito_sub) {
      await query.addColumn('users', 'cognito_sub', { type: DataTypes.TEXT, allowNull: true, unique: true }, { transaction });
    }
    if (!columns.patient_id) {
      await query.addColumn('users', 'patient_id', {
        type: DataTypes.TEXT, allowNull: true, references: { model: 'patients', key: 'id' },
      }, { transaction });
    }
    const tables = await query.showAllTables({ transaction });
    if (!tables.includes('web_sessions')) {
      await query.createTable('web_sessions', {
        id: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
        kind: { type: DataTypes.TEXT, allowNull: false },
        payload: { type: DataTypes.TEXT, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
      }, { transaction });
      await query.addConstraint('web_sessions', {
        fields: ['kind'], type: 'check', name: 'web_sessions_kind_check',
        where: { kind: { [Op.in]: ['login', 'session'] } }, transaction,
      });
    }
    const indexes = await query.showIndex('web_sessions', { transaction }) as Array<{ name: string }>;
    if (!indexes.some((index) => index.name === 'web_sessions_expiry')) {
      await query.addIndex('web_sessions', ['expires_at'], { name: 'web_sessions_expiry', transaction });
    }
  });
}

export async function down() {
  throw new Error('Cognito identities and sessions may predate this migration. Automatic deletion is disabled.');
}
