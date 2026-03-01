<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { getCurrentUser, setCurrentUser } from '../authenticateUser'

const isLoggedIn = ref(Boolean(getCurrentUser()))
const conversations = ref([])
const messages = ref([])
const selectedConversationId = ref('')
const draftMessage = ref('')
const statusText = ref('')
const conversationsReady = ref(false)
const messagesReady = ref(false)
const selectedConversationMeta = ref(null)
const lastStartedFromRouteKey = ref('')
const lastSentAtByConversation = ref({})
const route = useRoute()
const router = useRouter()

let authUnsubscribe = null
let conversationsUnsubscribe = null
let messagesUnsubscribe = null

function buildConversationId(listingId, uidOne, uidTwo) {
  const sortedParticipants = [uidOne, uidTwo].sort()
  return `${listingId}__${sortedParticipants[0]}__${sortedParticipants[1]}`
}

function formatDate(value) {
  if (!value?.toDate) {
    return ''
  }

  return value.toDate().toLocaleString()
}

function selectConversation(conversation) {
  selectedConversationId.value = conversation.id
  selectedConversationMeta.value = conversation
  subscribeToMessages(conversation.id)
}

function resetChatState() {
  conversations.value = []
  messages.value = []
  selectedConversationId.value = ''
  selectedConversationMeta.value = null
  draftMessage.value = ''
  statusText.value = ''
  conversationsReady.value = false
  messagesReady.value = false
  lastSentAtByConversation.value = {}
}

function stopConversationsListener() {
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe()
    conversationsUnsubscribe = null
  }
}

function stopMessagesListener() {
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
    messagesUnsubscribe = null
  }
}

function subscribeToConversations(uid) {
  stopConversationsListener()
  conversationsReady.value = false
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid),
    orderBy('updatedAt', 'desc')
  )

  conversationsUnsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
    const currentConversations = []
    snapshot.forEach((conversationDoc) => {
      const conversation = conversationDoc.data()
      currentConversations.push({
        id: conversationDoc.id,
        listingId: conversation.listingId || '',
        listingAddress: conversation.listingAddress || 'Listing',
        listingOwnerName: conversation.listingOwnerName || 'Pet owner',
        participantIds: Array.isArray(conversation.participantIds) ? conversation.participantIds : [],
        createdBy: conversation.createdBy || '',
        updatedAt: conversation.updatedAt || null,
        updatedAtLabel: formatDate(conversation.updatedAt),
        lastMessageText: conversation.lastMessageText || '',
      })
    })

    conversations.value = currentConversations
    conversationsReady.value = true

    if (!currentConversations.length) {
      stopMessagesListener()
      messages.value = []
      selectedConversationId.value = ''
      selectedConversationMeta.value = null
      return
    }

    if (!selectedConversationId.value) {
      selectConversation(currentConversations[0])
      return
    }

    const stillSelected = currentConversations.find((entry) => entry.id === selectedConversationId.value)
    if (!stillSelected) {
      selectConversation(currentConversations[0])
      return
    }

    selectedConversationMeta.value = stillSelected
  }, (error) => {
    console.error('Failed to stream conversations:', error)
    statusText.value = 'Failed to load conversations.'
    conversationsReady.value = true
  })
}

function subscribeToMessages(conversationId) {
  stopMessagesListener()
  messagesReady.value = false

  const messagesQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  )

  messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const streamedMessages = []
    snapshot.forEach((messageDoc) => {
      const message = messageDoc.data()
      streamedMessages.push({
        id: messageDoc.id,
        senderId: message.senderId || '',
        senderName: message.senderName || 'User',
        text: message.text || '',
        createdAt: message.createdAt || null,
        createdAtLabel: formatDate(message.createdAt),
      })
    })
    messages.value = streamedMessages
    messagesReady.value = true
  }, (error) => {
    console.error('Failed to stream messages:', error)
    statusText.value = 'Failed to load messages.'
    messagesReady.value = true
  })
}

async function ensureConversation(startPayload) {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    statusText.value = 'Sign in to start a conversation.'
    return
  }

  if (!startPayload?.listingId || !startPayload?.listingOwnerUid) {
    statusText.value = 'Cannot start chat for this listing.'
    return
  }

  if (startPayload.listingOwnerUid === currentUser.uid) {
    statusText.value = 'You cannot start a chat with your own listing.'
    return
  }

  const conversationId = buildConversationId(
    startPayload.listingId,
    currentUser.uid,
    startPayload.listingOwnerUid
  )

  const conversationRef = doc(db, 'conversations', conversationId)
  const existingConversation = await getDoc(conversationRef)
  if (!existingConversation.exists()) {
    await setDoc(conversationRef, {
      listingId: startPayload.listingId,
      listingAddress: startPayload.listingAddress || 'Listing',
      listingOwnerUid: startPayload.listingOwnerUid,
      listingOwnerName: startPayload.listingOwnerName || 'Pet owner',
      participantIds: [currentUser.uid, startPayload.listingOwnerUid].sort(),
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageText: '',
      lastMessageSenderId: '',
    })
  }

  selectedConversationId.value = conversationId
  const existingFromList = conversations.value.find((entry) => entry.id === conversationId) || null
  if (existingFromList) {
    selectedConversationMeta.value = existingFromList
  }
  subscribeToMessages(conversationId)
  statusText.value = 'Conversation ready.'
}

async function sendMessage() {
  const currentUser = getCurrentUser()
  if (!currentUser || !selectedConversationId.value) {
    return
  }

  const trimmedMessage = draftMessage.value.trim()
  if (!trimmedMessage) {
    return
  }

  if (trimmedMessage.length > 1000) {
    statusText.value = 'Keep messages under 1000 characters.'
    return
  }

  const lastSentAt = lastSentAtByConversation.value[selectedConversationId.value] || 0
  if (Date.now() - lastSentAt < 3000) {
    statusText.value = 'Please wait a few seconds before sending another message.'
    return
  }

  const lastMessage = messages.value[messages.value.length - 1]
  if (
    lastMessage &&
    lastMessage.senderId === currentUser.uid &&
    lastMessage.text?.trim() === trimmedMessage
  ) {
    statusText.value = 'You already sent this message.'
    return
  }

  const messageCollection = collection(db, 'conversations', selectedConversationId.value, 'messages')
  const senderName = currentUser.displayName || currentUser.email || 'User'

  try {
    await addDoc(messageCollection, {
      senderId: currentUser.uid,
      senderName,
      text: trimmedMessage,
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'conversations', selectedConversationId.value), {
      updatedAt: serverTimestamp(),
      lastMessageText: trimmedMessage,
      lastMessageSenderId: currentUser.uid,
    })

    lastSentAtByConversation.value = {
      ...lastSentAtByConversation.value,
      [selectedConversationId.value]: Date.now(),
    }
    draftMessage.value = ''
    statusText.value = ''
  } catch (error) {
    console.error('Failed to send message:', error)
    statusText.value = 'Failed to send message.'
  }
}

function handleStartChat(event) {
  ensureConversation(event.detail).catch((error) => {
    console.error('Failed to initialize conversation:', error)
    statusText.value = 'Failed to start chat.'
  })
}

function readStartPayloadFromRoute() {
  const listingId = typeof route.query.listingId === 'string' ? route.query.listingId.trim() : ''
  const listingOwnerUid = typeof route.query.listingOwnerUid === 'string' ? route.query.listingOwnerUid.trim() : ''
  if (!listingId || !listingOwnerUid) {
    return null
  }

  return {
    listingId,
    listingOwnerUid,
    listingAddress: typeof route.query.listingAddress === 'string' ? route.query.listingAddress : '',
    listingOwnerName: typeof route.query.listingOwnerName === 'string' ? route.query.listingOwnerName : '',
  }
}

async function maybeStartConversationFromRoute() {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    return
  }

  const startPayload = readStartPayloadFromRoute()
  if (!startPayload) {
    return
  }

  const routeStartKey = `${startPayload.listingId}__${startPayload.listingOwnerUid}`
  if (lastStartedFromRouteKey.value === routeStartKey) {
    return
  }

  lastStartedFromRouteKey.value = routeStartKey
  await ensureConversation(startPayload)
  router.replace({ path: '/chat' }).catch(() => {})
}

onMounted(() => {
  window.addEventListener('p2h:start-chat', handleStartChat)

  authUnsubscribe = auth.onAuthStateChanged((user) => {
    setCurrentUser(user || null)
    isLoggedIn.value = Boolean(user)
    statusText.value = ''

    stopMessagesListener()
    messages.value = []
    selectedConversationId.value = ''
    selectedConversationMeta.value = null

    if (!user) {
      lastStartedFromRouteKey.value = ''
      stopConversationsListener()
      resetChatState()
      return
    }

    subscribeToConversations(user.uid)
    maybeStartConversationFromRoute().catch((error) => {
      console.error('Failed to start route conversation:', error)
      statusText.value = 'Failed to start chat.'
    })
  })
})

watch(
  () => route.query,
  () => {
    maybeStartConversationFromRoute().catch((error) => {
      console.error('Failed to start route conversation:', error)
      statusText.value = 'Failed to start chat.'
    })
  },
  { deep: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('p2h:start-chat', handleStartChat)
  stopMessagesListener()
  stopConversationsListener()
  if (authUnsubscribe) {
    authUnsubscribe()
  }
})

const currentUid = computed(() => getCurrentUser()?.uid || '')
</script>

<template>
  <section class="box chat-panel">
    <h3 class="title is-5">Listing Chat</h3>
    <p class="subtitle is-6">Message a listing owner from the map popup.</p>

    <p v-if="statusText" class="is-size-7 chat-status">{{ statusText }}</p>
    <p v-if="!isLoggedIn" class="is-size-7">Sign in to use chat.</p>

    <div v-else class="chat-grid">
      <aside class="chat-sidebar">
        <h4 class="title is-6">Conversations</h4>
        <p v-if="!conversationsReady" class="is-size-7">Loading conversations...</p>
        <p v-else-if="!conversations.length" class="is-size-7">
          No conversations yet. Open a listing marker and press "Message Owner".
        </p>

        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          class="button is-fullwidth chat-conversation-button"
          :class="{ 'is-link is-light': selectedConversationId === conversation.id }"
          @click="selectConversation(conversation)"
        >
          <span class="chat-conversation-title">{{ conversation.listingAddress }}</span>
          <span class="chat-conversation-preview">{{ conversation.lastMessageText || 'No messages yet' }}</span>
        </button>
      </aside>

      <section class="chat-main">
        <h4 class="title is-6">
          {{
            selectedConversationMeta
              ? `Chat about ${selectedConversationMeta.listingAddress}`
              : 'Select a conversation'
          }}
        </h4>

        <div class="chat-messages">
          <p v-if="selectedConversationId && !messagesReady" class="is-size-7">Loading messages...</p>
          <p v-else-if="selectedConversationId && !messages.length" class="is-size-7">No messages yet.</p>

          <article
            v-for="message in messages"
            :key="message.id"
            class="box chat-message"
            :class="{ 'chat-message-self': message.senderId === currentUid }"
          >
            <p class="chat-message-author">{{ message.senderName }}</p>
            <p>{{ message.text }}</p>
            <p class="chat-message-time">{{ message.createdAtLabel }}</p>
          </article>
        </div>

        <div class="field mt-3">
          <label class="label" for="chatInput">Message</label>
          <div class="control">
            <textarea
              id="chatInput"
              v-model="draftMessage"
              class="textarea"
              rows="3"
              placeholder="Type your message"
              :disabled="!selectedConversationId"
            />
          </div>
        </div>

        <button
          class="button is-primary"
          :disabled="!selectedConversationId || !draftMessage.trim()"
          @click="sendMessage"
        >
          Send Message
        </button>
      </section>
    </div>
  </section>
</template>

<style scoped>
.chat-status {
  color: #9f6000;
}

.chat-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1rem;
}

.chat-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-conversation-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  height: auto;
  padding: 0.6rem 0.8rem;
}

.chat-conversation-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.chat-conversation-preview {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.chat-main {
  display: flex;
  flex-direction: column;
}

.chat-messages {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 0.5rem;
  padding: 0.5rem;
  background: #fafafa;
}

.chat-message {
  margin-bottom: 0.5rem;
}

.chat-message-self {
  border-left: 4px solid #3273dc;
}

.chat-message-author {
  margin: 0;
  font-weight: 700;
}

.chat-message-time {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: #666;
}

@media (max-width: 768px) {
  .chat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
