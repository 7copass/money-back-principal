/**
 * Componente de exemplo para envio de emails
 * Este componente pode ser integrado no painel administrativo
 */

import React, { useState } from 'react';
import { sendEmail, sendNotificationEmail } from '../services/emailService';
import toast from 'react-hot-toast';

interface EmailFormProps {
  clients?: Array<{ id: string; name: string; email: string }>;
  companyName?: string;
}

export const EmailSenderComponent: React.FC<EmailFormProps> = ({ 
  clients = [], 
  companyName = 'Fidelify' 
}) => {
  const [emailType, setEmailType] = useState<'generic' | 'notification'>('generic');
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    clientName: ''
  });
  const [sending, setSending] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.to || !formData.message) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSending(true);
    
    try {
      let result;
      
      if (emailType === 'generic') {
        result = await sendEmail({
          to: formData.to,
          subject: formData.subject || 'Mensagem da ' + companyName,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Mensagem de ${companyName}</h2>
              <p>${formData.message.replace(/\n/g, '<br>')}</p>
            </div>
          `,
          text: formData.message
        });
      } else {
        result = await sendNotificationEmail({
          to: formData.to,
          clientName: formData.clientName || 'Cliente',
          message: formData.message,
          companyName
        });
      }

      if (result.success) {
        toast.success('Email enviado com sucesso!');
        setFormData({ to: '', subject: '', message: '', clientName: '' });
      } else {
        toast.error('Erro ao enviar email: ' + result.error);
      }
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '600px'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        📧 Enviar Email
      </h2>

      <form onSubmit={handleSendEmail}>
        {/* Tipo de Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Tipo de Email
          </label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          >
            <option value="generic">Email Genérico</option>
            <option value="notification">Notificação com Template</option>
          </select>
        </div>

        {/* Email do Destinatário */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Email do Destinatário *
          </label>
          {clients.length > 0 ? (
            <select
              value={formData.to}
              onChange={(e) => {
                const selectedClient = clients.find(c => c.email === e.target.value);
                setFormData({
                  ...formData,
                  to: e.target.value,
                  clientName: selectedClient?.name || ''
                });
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.email}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="cliente@exemplo.com"
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          )}
        </div>

        {/* Nome do Cliente (para template de notificação) */}
        {emailType === 'notification' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nome do Cliente
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="João Silva"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        )}

        {/* Assunto (apenas para email genérico) */}
        {emailType === 'generic' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Assunto
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Assunto do email"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        )}

        {/* Mensagem */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Mensagem *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Digite sua mensagem aqui..."
            required
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={sending}
          style={{
            width: '100%',
            padding: '12px',
            background: sending ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: sending ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {sending ? '📤 Enviando...' : '📧 Enviar Email'}
        </button>
      </form>

      {/* Informações */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#f0f7ff',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#666'
      }}>
        💡 <strong>Dica:</strong> Os emails serão enviados via SendGrid. 
        Verifique se o remetente está autenticado no painel do SendGrid.
      </div>
    </div>
  );
};

export default EmailSenderComponent;
