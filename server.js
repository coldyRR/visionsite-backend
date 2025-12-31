const multer = require('multer');
require('dotenv').config();
// --- CLOUDINARY CONFIGURAÇÃO ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configura as chaves do Cloudinary aqui no start
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// -------------------------------

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const fs = require('fs');

// Inicializar express
const app = express();

// (Removi a parte de criar pasta 'uploads' porque na nuvem não precisa)

// Conectar ao banco de dados
connectDB();

// Middlewares
// Configuração do CORS (Lista VIP: Localhost + Vercel)
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',       // Live Server Local
        'http://localhost:5500',       // Live Server Local (alternativo)
        'https://visionsite-frontend.vercel.app' // Seu Site Oficial
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads) - Mantemos por segurança pra fotos antigas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/properties', require('./routes/properties')); // <--- O ULPOAD TÁ AQUI DENTRO
app.use('/api/appointments', require('./routes/appointments'));

// Rota de teste
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'API VISION Imóveis está funcionando!',
        version: '1.0.0'
    });
});

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'Erro no upload: ' + err.message
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno do servidor'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║          🏢 VISION IMÓVEIS - API SERVER              ║
║                                                        ║
║  Servidor rodando na porta: ${PORT}                       ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}                      ║
║                                                        ║
║  Rotas disponíveis:                                   ║
║  • GET  /api                  - Info da API           ║
║  • GET  /api/health           - Health check          ║
║  • POST /api/auth/login       - Login                 ║
║  • GET  /api/auth/me          - Usuário atual         ║
║  • GET  /api/properties       - Listar imóveis        ║
║  • POST /api/properties       - Criar imóvel          ║
║  • GET  /api/users            - Listar usuários       ║
║  • POST /api/users            - Criar corretor        ║
║  • GET  /api/appointments     - Listar cadastros      ║
║  • POST /api/appointments     - Criar cadastro        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;