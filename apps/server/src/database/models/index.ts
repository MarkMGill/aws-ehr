import { User } from './user.model.js';
import { Patient } from './patient.model.js';
import { ClinicalNote } from './clinical-note.model.js';
import { Prescription } from './prescription.model.js';
import { BillingRecord } from './billing-record.model.js';
import { Document } from './document.model.js';

User.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
Patient.hasMany(User, { as: 'portalUsers', foreignKey: 'patientId' });
Patient.hasMany(ClinicalNote, { as: 'clinicalNotes', foreignKey: 'patientId' });
ClinicalNote.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
User.hasMany(ClinicalNote, { as: 'clinicalNotes', foreignKey: 'authorId' });
ClinicalNote.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
Patient.hasMany(Prescription, { as: 'prescriptions', foreignKey: 'patientId' });
Prescription.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
Patient.hasMany(BillingRecord, { as: 'billingRecords', foreignKey: 'patientId' });
BillingRecord.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
Patient.hasMany(Document, { as: 'documents', foreignKey: 'patientId' });
Document.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });

export { User, Patient, ClinicalNote, Prescription, BillingRecord, Document };
export { WebSession } from './web-session.model.js';
