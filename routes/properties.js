const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Property = require('../models/Property');
const { protect, brokerOrAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// --- IMPORTAÇÕES DO CLOUDINARY ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configurar upload para o Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'vision_imoveis',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// @route   GET /api/properties
// @desc    Listar todos os imóveis (público)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { type, location, minPrice, maxPrice, featured } = req.query;

        // Construir filtros
        const filters = { active: true };

        if (type) filters.type = type;
        if (location) filters.location = new RegExp(location, 'i');
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.$gte = Number(minPrice);
            if (maxPrice) filters.price.$lte = Number(maxPrice);
        }
        if (featured === 'true') filters.featured = true;

        const properties = await Property.find(filters)
            .populate('createdBy', 'name email')
            .sort({ featured: -1, createdAt: -1 });

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Erro ao buscar imóveis:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar imóveis'
        });
    }
});

// @route   GET /api/properties/featured
// @desc    Listar imóveis em destaque
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const properties = await Property.find({ active: true })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(6);

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Erro ao buscar imóveis em destaque:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar imóveis em destaque'
        });
    }
});

// @route   GET /api/properties/:id
// @desc    Obter imóvel por ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Imóvel não encontrado'
            });
        }

        res.json({
            success: true,
            data: property
        });
    } catch (error) {
        console.error('Erro ao buscar imóvel:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar imóvel'
        });
    }
});

// ROTAS PROTEGIDAS (Requerem autenticação)

// @route   POST /api/properties
// @desc    Criar novo imóvel
// @access  Private (Corretor ou Admin)
router.post('/', [protect, brokerOrAdmin, upload.array('images', 10)], async (req, res) => {
    try {
        const {
            title, description, type, price, location,
            area, bedrooms, bathrooms, garages, featured
        } = req.body;

        // Validar campos obrigatórios
        if (!title || !description || !type || !price || !location || !area || !bedrooms || !bathrooms || !garages) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos obrigatórios devem ser preenchidos'
            });
        }

        // Validar imagens
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Pelo menos uma imagem é obrigatória'
            });
        }

        // Paths das imagens (AGORA PEGA O LINK DA NUVEM)
        const images = req.files.map(file => file.path);

        // Criar imóvel
        const property = await Property.create({
            title,
            description,
            type,
            price: Number(price),
            location,
            area: Number(area),
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms),
            garages: Number(garages),
            images,
            featured: featured === 'true' || featured === true,
            active: true,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Imóvel cadastrado com sucesso',
            data: property
        });

    } catch (error) {
        console.error('Erro ao criar imóvel:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar imóvel'
        });
    }
});

// @route   PUT /api/properties/:id
// @desc    Atualizar imóvel
// @access  Private (Corretor ou Admin)
router.put('/:id', [protect, brokerOrAdmin, upload.array('images', 10)], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Imóvel não encontrado'
            });
        }

        // Verificar permissão (admin pode editar tudo, corretor só seus imóveis)
        if (req.user.role !== 'admin' && property.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para editar este imóvel'
            });
        }

        const {
            title, description, type, price, location,
            area, bedrooms, bathrooms, garages, featured, active
        } = req.body;

        // Atualizar campos
        if (title) property.title = title;
        if (description) property.description = description;
        if (type) property.type = type;
        if (price) property.price = Number(price);
        if (location) property.location = location;
        if (area) property.area = Number(area);
        if (bedrooms) property.bedrooms = Number(bedrooms);
        if (bathrooms) property.bathrooms = Number(bathrooms);
        if (garages) property.garages = Number(garages);
        if (typeof featured !== 'undefined') property.featured = featured === 'true' || featured === true;
        if (typeof active !== 'undefined') property.active = active === 'true' || active === true;

        // Atualizar imagens se houver (AGORA PEGA O LINK DA NUVEM)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            property.images = newImages;
        }

        await property.save();

        res.json({
            success: true,
            message: 'Imóvel atualizado com sucesso',
            data: property
        });

    } catch (error) {
        console.error('Erro ao atualizar imóvel:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar imóvel'
        });
    }
});

// @route   DELETE /api/properties/:id
// @desc    Deletar imóvel
// @access  Private (Corretor ou Admin)
router.delete('/:id', [protect, brokerOrAdmin], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Imóvel não encontrado'
            });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && property.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para excluir este imóvel'
            });
        }

        await property.deleteOne();

        res.json({
            success: true,
            message: 'Imóvel excluído com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar imóvel:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar imóvel'
        });
    }
});

module.exports = router;