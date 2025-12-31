const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Todas as rotas requerem admin
router.use(protect, adminOnly);

// GET /api/users - Listar todos
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
    }
});

// GET /api/users/brokers - Listar corretores
router.get('/brokers', async (req, res) => {
    try {
        const brokers = await User.find({ role: 'corretor' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: brokers.length, data: brokers });
    } catch (error) {
        console.error('Erro ao buscar corretores:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar corretores' });
    }
});

// POST /api/users - Criar usuário (corretor OU admin)
router.post('/', [
    body('username').trim().isLength({ min: 3 }).withMessage('Usuário deve ter no mínimo 3 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('role').optional().isIn(['corretor', 'admin']).withMessage('Role inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, email, password, name, role } = req.body;

        const userExists = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
        });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'Usuário ou email já cadastrado' });
        }

        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            name,
            role: role || 'corretor' // Permite admin ou corretor
        });

        res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso', data: user });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar usuário' });
    }
});

// GET /api/users/:id - Obter por ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
    }
});

// PUT /api/users/:id - Atualizar
router.put('/:id', async (req, res) => {
    try {
        const { username, email, name, password, active, role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        // Atualizar campos
        if (username) user.username = username.toLowerCase();
        if (email) user.email = email.toLowerCase();
        if (name) user.name = name;
        if (password) user.password = password;
        if (typeof active !== 'undefined') user.active = active;
        if (role) user.role = role; // Permite mudar role

        await user.save();
        res.json({ success: true, message: 'Usuário atualizado', data: user });

    } catch (error) {
        console.error('Erro ao atualizar:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Usuário ou email já existe' });
        }
        res.status(500).json({ success: false, message: 'Erro ao atualizar usuário' });
    }
});

// DELETE /api/users/:id - Deletar
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        // Verificar se é o último admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(403).json({ success: false, message: 'Não é possível excluir o último administrador' });
            }
        }

        await user.deleteOne();
        res.json({ success: true, message: 'Usuário excluído' });

    } catch (error) {
        console.error('Erro ao deletar:', error);
        res.status(500).json({ success: false, message: 'Erro ao deletar usuário' });
    }
});

module.exports = router;
