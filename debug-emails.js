/**
 * Script de DEBUG - Testar integração de emails
 * Este script simula o fluxo completo para verificar se os emails funcionam
 */

// Importar diretamente
import { sendWelcomeEmail, sendCashbackEmail, sendCashbackRedeemedEmail } from './src/services/emailService.js';

console.log('\n🔍 TESTE DE DEBUG - Verificando Integração de Emails\n');
console.log('═'.repeat(60));

// Verificar se as funções estão disponíveis
console.log('\n✓ Verificando imports...');
console.log('  sendWelcomeEmail:', typeof sendWelcomeEmail);
console.log('  sendCashbackEmail:', typeof sendCashbackEmail);
console.log('  sendCashbackRedeemedEmail:', typeof sendCashbackRedeemedEmail);

if (typeof sendWelcomeEmail !== 'function') {
    console.error('\n❌ ERRO: Funções de email não foram importadas corretamente!');
    process.exit(1);
}

console.log('\n✓ Imports OK!\n');

// Teste 1: Email de boas-vindas
console.log('📧 Teste 1: Email de Boas-vindas');
try {
    const result = await sendWelcomeEmail({
        to: 'victorhugosantanaalmeida@gmail.com',
        name: 'Teste Cliente',
        companyName: 'Fidelify'
    });

    if (result.success) {
        console.log('   ✅ Email de boas-vindas enviado!\n');
    } else {
        console.log('   ❌ Erro:', result.error, '\n');
    }
} catch (error) {
    console.error('   ❌ Exceção:', error.message, '\n');
}

// Aguardar
await new Promise(r => setTimeout(r, 1000));

// Teste 2: Email de cashback
console.log('📧 Teste 2: Email de Cashback Recebido');
try {
    const result = await sendCashbackEmail({
        to: 'victorhugosantanaalmeida@gmail.com',
        clientName: 'Teste Cliente',
        cashbackAmount: 25.50,
        cashbackBalance: 125.00,
        companyName: 'Fidelify'
    });

    if (result.success) {
        console.log('   ✅ Email de cashback enviado!\n');
    } else {
        console.log('   ❌ Erro:', result.error, '\n');
    }
} catch (error) {
    console.error('   ❌ Exceção:', error.message, '\n');
}

// Aguardar
await new Promise(r => setTimeout(r, 1000));

// Teste 3: Email de resgate
console.log('📧 Teste 3: Email de Cashback Resgatado');
try {
    const result = await sendCashbackRedeemedEmail({
        to: 'victorhugosantanaalmeida@gmail.com',
        clientName: 'Teste Cliente',
        redeemedAmount: 50.00,
        remainingBalance: 75.00,
        companyName: 'Fidelify'
    });

    if (result.success) {
        console.log('   ✅ Email de resgate enviado!\n');
    } else {
        console.log('   ❌ Erro:', result.error, '\n');
    }
} catch (error) {
    console.error('   ❌ Exceção:', error.message, '\n');
}

console.log('═'.repeat(60));
console.log('\n✅ Testes concluídos!');
console.log('\n📬 Se todos passaram, verifique seu email:');
console.log('   victorhugosantanaalmeida@gmail.com\n');
console.log('═'.repeat(60));
