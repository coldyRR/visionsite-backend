const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true,
        maxlength: [200, 'Título muito longo']
    },
    description: {
        type: String,
        required: [true, 'Descrição é obrigatória'],
        trim: true,
        maxlength: [2000, 'Descrição muito longa']
    },
    type: {
        type: String,
        required: [true, 'Tipo é obrigatório'],
        enum: ['apartamento', 'casa', 'terreno', 'comercial']
    },
    price: {
        type: Number,
        required: [true, 'Preço é obrigatório'],
        min: [0, 'Preço não pode ser negativo']
    },
    location: {
        type: String,
        required: [true, 'Localização é obrigatória'],
        trim: true
    },
    area: {
        type: Number,
        required: [true, 'Área é obrigatória'],
        min: [0, 'Área não pode ser negativa']
    },
    bedrooms: {
        type: Number,
        required: [true, 'Número de quartos é obrigatório'],
        min: [0, 'Quartos não pode ser negativo']
    },
    bathrooms: {
        type: Number,
        required: [true, 'Número de banheiros é obrigatório'],
        min: [0, 'Banheiros não pode ser negativo']
    },
    garages: {
        type: Number,
        required: [true, 'Número de vagas é obrigatório'],
        min: [0, 'Vagas não pode ser negativo']
    },
    images: [{
        type: String,
        required: true
    }],
    featured: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Índice para busca
propertySchema.index({ title: 'text', description: 'text', location: 'text' });
propertySchema.index({ type: 1, price: 1 });
propertySchema.index({ featured: 1, active: 1 });

module.exports = mongoose.model('Property', propertySchema);
