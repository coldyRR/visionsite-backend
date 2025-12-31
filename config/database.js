const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
        
        // Criar usuário admin padrão se não existir
        const User = require('../models/User');
        const adminExists = await User.findOne({ username: 'admin' });
        
        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: 'admin123', // Será hashado automaticamente
                email: 'admin@visionimoveis.com.br',
                name: 'Administrador',
                role: 'admin'
            });
            console.log('✅ Usuário admin criado');
        }
        
    } catch (error) {
        console.error(`❌ Erro ao conectar MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
