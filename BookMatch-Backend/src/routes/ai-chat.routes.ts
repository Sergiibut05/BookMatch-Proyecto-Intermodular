import { Router } from 'express';
import { getFirestore } from '../utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';
import { env } from '../config/env.js';

const router = Router();

function getN8nWebhookUrl(): string | null {
  const url = env.N8N_WEBHOOK_URL;
  if (!url || url.includes('YOUR_NEW_WEBHOOK_ID')) return null;
  return url;
}

// POST /api/ai-chat/send-message
router.post('/send-message', async (req, res) => {
  try {
    const { userId, conversationId, content } = req.body;

    if (!userId || !conversationId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const firestore = getFirestore();
    
    // 1. Crear documento de mensaje del usuario en Firestore
    const userMessageRef = await firestore
      .collection(`users/${userId}/conversations/${conversationId}/messages`)
      .add({
        role: 'user',
        content: content.trim(),
        timestamp: FieldValue.serverTimestamp(),
        status: 'completed'
      });

    // 2. Crear documento placeholder para respuesta de IA
    const assistantMessageRef = await firestore
      .collection(`users/${userId}/conversations/${conversationId}/messages`)
      .add({
        role: 'assistant',
        content: '',
        timestamp: FieldValue.serverTimestamp(),
        status: 'processing',
        metadata: {}
      });

    // 3. Actualizar contador de mensajes en conversación
    await firestore
      .doc(`users/${userId}/conversations/${conversationId}`)
      .update({
        messageCount: FieldValue.increment(2),
        updatedAt: FieldValue.serverTimestamp()
      });

    // 4. Disparar workflow de n8n
    const webhookUrl = getN8nWebhookUrl();
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL no configurada en .env. Añade la URL real de tu webhook n8n.');
      return res.status(503).json({
        error: 'Servicio de IA no configurado',
        message: 'El webhook de n8n no está configurado. Configura N8N_WEBHOOK_URL en el servidor.'
      });
    }
    await axios.post(webhookUrl, {
      userId,
      conversationId,
      messageId: assistantMessageRef.id,
      userMessage: content,
      baseUrl: req.headers.origin || env.FRONTEND_URL
    });

    res.status(200).json({ 
      success: true,
      userMessageId: userMessageRef.id,
      assistantMessageId: assistantMessageRef.id
    });

  } catch (error) {
    console.error('Error in send-message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

