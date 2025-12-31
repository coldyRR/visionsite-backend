const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
        
        // --- BLOCAGEM DE CRIAÇÃO DE ADMIN (CORRIGIDA) ---
        try {
            const User = require('../models/User');
            
            // Verifica se existe alguém com esse username OU esse email
            const adminExists = await User.findOne({ 
                $or: [
                    { username: 'admin' }, 
                    { email: 'admin@visionimoveis.com.br' }
                ]
            });
            
            if (!adminExists) {
                await User.create({
                    username: 'admin',
                    password: 'admin123',
                    email: 'admin@visionimoveis.com.br',
                    name: 'Administrador',
                    role: 'admin'
                });
                console.log('✅ Usuário admin criado');
            } else {
                console.log('ℹ️ Admin já existe no banco. Iniciando servidor normalmente.');
            }
        } catch (adminError) {
            // Se der erro aqui, a gente só avisa, NÃO derruba o servidor
            console.error(`⚠️ Aviso: Erro ao verificar admin (Ignorado): ${adminError.message}`);
        }
        // ------------------------------------------------

    } catch (error) {
        console.error(`❌ Erro FATAL ao conectar MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;