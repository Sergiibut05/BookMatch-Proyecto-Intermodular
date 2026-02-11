import { Router } from 'express';
import { getFirestore } from '../utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';

const router = Router();
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 
  'https://sergii05.app.n8n.cloud/webhook/YOUR_NEW_WEBHOOK_ID';

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
    await axios.post(N8N_WEBHOOK_URL, {
      userId,
      conversationId,
      messageId: assistantMessageRef.id,
      userMessage: content,
      baseUrl: req.headers.origin || process.env.FRONTEND_URL
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

