const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verificar se está autenticado
exports.protect = async (req, res, next) => {
    let token;

    // Verificar se o token está no header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Não autorizado - Token não fornecido'
        });
    }

    try {
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuário
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user || !req.user.active) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado ou inativo'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Não autorizado - Token inválido'
        });
    }
};

// Verificar se é admin
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado - Apenas administradores'
        });
    }
};

// Verificar se é admin ou corretor
exports.brokerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'corretor')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado'
        });
    }
};
