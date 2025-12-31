const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const { protect, adminOnly } = require('../middleware/auth');

// @route   POST /api/appointments
// @desc    Criar cadastro de interesse (público)
// @access  Public
router.post('/', [
    body('propertyId').notEmpty().withMessage('ID do imóvel é obrigatório'),
    body('clientName').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('clientPhone').trim().notEmpty().withMessage('Telefone é obrigatório'),
    body('clientEmail').optional().isEmail().withMessage('Email inválido')
], async (req, res) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { propertyId, clientName, clientPhone, clientEmail, clientMessage } = req.body;

        // Verificar se o imóvel existe
        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Imóvel não encontrado'
            });
        }

        // Criar cadastro
        const appointment = await Appointment.create({
            property: propertyId,
            propertyTitle: property.title,
            clientName,
            clientPhone,
            clientEmail,
            clientMessage
        });

        res.status(201).json({
            success: true,
            message: 'Interesse cadastrado com sucesso!',
            data: appointment
        });

    } catch (error) {
        console.error('Erro ao criar cadastro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar interesse'
        });
    }
});

// ROTAS PROTEGIDAS (Admin only)

// @route   GET /api/appointments
// @desc    Listar todos os cadastros
// @access  Private/Admin
router.get('/', [protect, adminOnly], async (req, res) => {
    try {
        const { status, propertyId } = req.query;

        // Construir filtros
        const filters = {};
        if (status) filters.status = status;
        if (propertyId) filters.property = propertyId;

        const appointments = await Appointment.find(filters)
            .populate('property', 'title location price')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.error('Erro ao buscar cadastros:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cadastros'
        });
    }
});

// @route   GET /api/appointments/:id
// @desc    Obter cadastro por ID
// @access  Private/Admin
router.get('/:id', [protect, adminOnly], async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('property', 'title location price images');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cadastro não encontrado'
            });
        }

        res.json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.error('Erro ao buscar cadastro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cadastro'
        });
    }
});

// @route   PUT /api/appointments/:id
// @desc    Atualizar status do cadastro
// @access  Private/Admin
router.put('/:id', [protect, adminOnly], async (req, res) => {
    try {
        const { status } = req.body;

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cadastro não encontrado'
            });
        }

        if (status) {
            appointment.status = status;
            await appointment.save();
        }

        res.json({
            success: true,
            message: 'Status atualizado com sucesso',
            data: appointment
        });

    } catch (error) {
        console.error('Erro ao atualizar cadastro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar cadastro'
        });
    }
});

// @route   DELETE /api/appointments/:id
// @desc    Deletar cadastro
// @access  Private/Admin
router.delete('/:id', [protect, adminOnly], async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cadastro não encontrado'
            });
        }

        await appointment.deleteOne();

        res.json({
            success: true,
            message: 'Cadastro excluído com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar cadastro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar cadastro'
        });
    }
});

module.exports = router;
