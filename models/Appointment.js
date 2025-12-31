const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    propertyTitle: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: [true, 'Nome do cliente é obrigatório'],
        trim: true
    },
    clientPhone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
    },
    clientEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    clientMessage: {
        type: String,
        trim: true,
        maxlength: [1000, 'Mensagem muito longa']
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Índices
appointmentSchema.index({ property: 1, createdAt: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
