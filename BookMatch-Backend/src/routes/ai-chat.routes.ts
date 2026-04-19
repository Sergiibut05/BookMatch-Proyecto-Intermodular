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

type ChatMode = 'chat' | 'playlist_builder';

const VALID_MODES: ReadonlySet<ChatMode> = new Set(['chat', 'playlist_builder']);
const MAX_ITEMS_DEFAULT_PLAYLIST = 8;
const MAX_ITEMS_HARD_CAP = 20;

function normalizeMode(raw: unknown): ChatMode {
  if (typeof raw === 'string' && VALID_MODES.has(raw as ChatMode)) {
    return raw as ChatMode;
  }
  return 'chat';
}

function normalizeMaxItems(raw: unknown, mode: ChatMode): number | null {
  if (mode !== 'playlist_builder') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return MAX_ITEMS_DEFAULT_PLAYLIST;
  const clamped = Math.max(3, Math.min(MAX_ITEMS_HARD_CAP, Math.trunc(n)));
  return clamped;
}

type CurrentDraftItem = { catalogBookId: number; position: number; note: string | null };
type CurrentDraft = {
  title: string | null;
  description: string | null;
  items: CurrentDraftItem[];
};

/**
 * Normaliza el `currentDraft` que el frontend envía cuando el usuario ha
 * estado iterando sobre una playlist en modo playlist_builder. Rechaza
 * items inválidos, aplica límites y devuelve `null` si no hay items útiles.
 *
 * Solo aplica en modo playlist; en modo chat normal se ignora.
 */
function normalizeCurrentDraft(raw: unknown, mode: ChatMode): CurrentDraft | null {
  if (mode !== 'playlist_builder') return null;
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d['items'])) return null;

  const items: CurrentDraftItem[] = [];
  const seen = new Set<number>();
  for (const rawItem of d['items']) {
    if (items.length >= MAX_ITEMS_HARD_CAP) break;
    if (!rawItem || typeof rawItem !== 'object') continue;
    const obj = rawItem as Record<string, unknown>;
    const id = typeof obj['catalogBookId'] === 'number'
      ? obj['catalogBookId']
      : Number(obj['catalogBookId']);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    const note = typeof obj['note'] === 'string' ? obj['note'].slice(0, 200) : null;
    items.push({ catalogBookId: Math.trunc(id), position: items.length + 1, note });
  }
  if (items.length === 0) return null;

  const title = typeof d['title'] === 'string' ? d['title'].slice(0, 120) : null;
  const description = typeof d['description'] === 'string' ? d['description'].slice(0, 500) : null;
  return { title, description, items };
}

// POST /api/ai-chat/send-message
router.post('/send-message', async (req, res) => {
  try {
    const { userId, conversationId, content } = req.body as Record<string, unknown>;

    if (!userId || !conversationId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof userId !== 'string' || typeof conversationId !== 'string' || typeof content !== 'string') {
      return res.status(400).json({ error: 'userId, conversationId and content must be strings' });
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'content cannot be empty' });
    }

    // Modo conversacional: chat (default) | playlist_builder (con co-curación de libros)
    const mode = normalizeMode(req.body?.mode);
    const maxItems = normalizeMaxItems(req.body?.maxItems, mode);
    // Borrador actual (para que la IA itere sobre él en vez de crear otra playlist).
    const currentDraft = normalizeCurrentDraft(req.body?.currentDraft, mode);

    const firestore = getFirestore();

    // 1. Crear documento de mensaje del usuario en Firestore
    const userMessageRef = await firestore
      .collection(`users/${userId}/conversations/${conversationId}/messages`)
      .add({
        role: 'user',
        content: trimmed,
        timestamp: FieldValue.serverTimestamp(),
        status: 'completed',
        // Guardamos el modo en metadata por si el front lo necesita para
        // re-render o auditoría posterior.
        metadata: { mode, ...(maxItems ? { maxItems } : {}) }
      });

    // 2. Crear documento placeholder para respuesta de IA
    const assistantMessageRef = await firestore
      .collection(`users/${userId}/conversations/${conversationId}/messages`)
      .add({
        role: 'assistant',
        content: '',
        timestamp: FieldValue.serverTimestamp(),
        status: 'processing',
        metadata: { mode, ...(maxItems ? { maxItems } : {}) }
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
      userMessage: trimmed,
      baseUrl: req.headers.origin || env.FRONTEND_URL,
      mode,
      ...(maxItems ? { maxItems } : {}),
      ...(currentDraft ? { currentDraft } : {})
    });

    res.status(200).json({
      success: true,
      userMessageId: userMessageRef.id,
      assistantMessageId: assistantMessageRef.id,
      mode,
      ...(maxItems ? { maxItems } : {}),
      ...(currentDraft ? { hadCurrentDraft: true } : {})
    });

  } catch (error) {
    console.error('Error in send-message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

