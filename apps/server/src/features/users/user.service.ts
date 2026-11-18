import { sequelize } from '../../database/sequelize.js';
import { User, Patient } from '../../database/models/index.js';

export async function findUserByCognitoSub(sub: string) {
  return User.findOne({ where: { cognitoSub: sub } });
}

export async function linkCognitoUser(email: string, sub: string, patientId?: string) {
  if (!email || !sub) throw new Error('Provide a local profile email and the actual Cognito sub.');
  if (/^(YOUR_|REPLACE_|<)/i.test(sub) || sub.endsWith('>')) {
    throw new Error('Replace the example placeholder with the actual sub attribute from Cognito > Users > your user.');
  }
  return sequelize.transaction(async (transaction) => {
    const user = await User.findOne({ where: { email }, transaction, lock: transaction.LOCK.UPDATE });
    if (!user || (user.cognitoSub && user.cognitoSub !== sub)) {
      throw new Error('Profile not found or already linked to another identity.');
    }
    if (patientId && !await Patient.findByPk(patientId, { transaction })) throw new Error('Patient chart not found.');
    if (user.role === 'patient' && !(patientId ?? user.patientId)) {
      throw new Error('Provide a patient chart ID when linking a patient account.');
    }
    await user.update({ cognitoSub: sub, ...(patientId ? { patientId } : {}) }, { transaction });
    return { id: user.id, role: user.role };
  });
}
