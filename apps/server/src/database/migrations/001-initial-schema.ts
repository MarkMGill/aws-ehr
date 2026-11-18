import { DataTypes, fn, type QueryInterface, type ModelAttributeColumnOptions } from 'sequelize';

// Adopt existing tables without changing their contents. Fresh databases get the
// same table/column names as the original SQL setup.
export async function up({ context: query }: { context: QueryInterface }) {
  await query.sequelize.transaction(async (transaction) => {
    const tables = new Set(await query.showAllTables({ transaction }));
    const id = (): ModelAttributeColumnOptions => ({ type: DataTypes.TEXT, primaryKey: true, allowNull: false });
    const text = (): ModelAttributeColumnOptions => ({ type: DataTypes.TEXT, allowNull: false });
    const created = (): ModelAttributeColumnOptions => ({ type: DataTypes.DATE, defaultValue: fn('NOW'), allowNull: true });
    const reference = (table: string): ModelAttributeColumnOptions => ({
      type: DataTypes.TEXT, allowNull: true, references: { model: table, key: 'id' },
    });
    const create = async (table: string, columns: Record<string, ModelAttributeColumnOptions>) => {
      if (!tables.has(table)) await query.createTable(table, columns, { transaction });
    };
    await create('users', {
      id: id(), email: { ...text(), unique: true }, password_hash: text(),
      first_name: text(), last_name: text(), role: text(), created_at: created(),
    });
    await create('patients', {
      id: id(), first_name: text(), last_name: text(), dob: { type: DataTypes.DATEONLY, allowNull: false },
      mrn: { ...text(), unique: true }, status: text(), created_at: created(),
    });
    await create('clinical_notes', {
      id: id(), patient_id: reference('patients'), author_id: reference('users'),
      title: text(), body: text(), created_at: created(),
    });
    await create('prescriptions', {
      id: id(), patient_id: reference('patients'), medication: text(), dosage: text(),
      frequency: text(), prescriber_name: text(), status: text(), created_at: created(),
    });
    await create('billing_records', {
      id: id(), patient_id: reference('patients'), service: text(),
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, status: text(),
      due_date: { type: DataTypes.DATEONLY, allowNull: false }, created_at: created(),
    });
    await create('documents', {
      id: id(), patient_id: reference('patients'), name: text(), category: text(),
      s3_key: text(), uploaded_at: created(),
    });
  });
}

export async function down() {
  throw new Error('This baseline adopts existing EHR tables. Roll back with a reviewed forward migration; automatic table deletion is disabled.');
}
