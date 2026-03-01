<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  addDoc,
  collection,
  deleteDoc,
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
const isSelectedPeerBlockedByMe = ref(false)
const isSelectedPeerBlockingMe = ref(false)
const blockStateReady = ref(false)
const authReadyForFirestore = ref(false)
const hasRetriedConversationStreamAfterAuthRefresh = ref(false)
const messagesContainerRef = ref(null)
const route = useRoute()
const router = useRouter()

let authUnsubscribe = null
let createdByConversationsUnsubscribe = null
let ownerConversationsUnsubscribe = null
let messagesUnsubscribe = null
let createdByConversationsCache = []
let ownerConversationsCache = []

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
  isSelectedPeerBlockedByMe.value = false
  isSelectedPeerBlockingMe.value = false
  blockStateReady.value = false
}

function stopConversationsListener() {
  if (createdByConversationsUnsubscribe) {
    createdByConversationsUnsubscribe()
    createdByConversationsUnsubscribe = null
  }
  if (ownerConversationsUnsubscribe) {
    ownerConversationsUnsubscribe()
    ownerConversationsUnsubscribe = null
  }
}

function stopMessagesListener() {
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
    messagesUnsubscribe = null
  }
}

function normalizeConversation(conversationDoc) {
  const conversation = conversationDoc.data()
  return {
    id: conversationDoc.id,
    listingId: conversation.listingId || '',
    listingAddress: conversation.listingAddress || 'Listing',
    listingOwnerName: conversation.listingOwnerName || 'Pet owner',
    createdByName: conversation.createdByName || 'User',
    listingOwnerUid: conversation.listingOwnerUid || '',
    participantIds: Array.isArray(conversation.participantIds) ? conversation.participantIds : [],
    createdBy: conversation.createdBy || '',
    updatedAt: conversation.updatedAt || null,
    updatedAtLabel: formatDate(conversation.updatedAt),
    lastMessageText: conversation.lastMessageText || '',
  }
}

function applyMergedConversations() {
  const mergedById = new Map()
  createdByConversationsCache.forEach((conversation) => {
    mergedById.set(conversation.id, conversation)
  })
  ownerConversationsCache.forEach((conversation) => {
    mergedById.set(conversation.id, conversation)
  })

  const currentConversations = [...mergedById.values()]
    .sort((a, b) => {
      const aMs = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0
      const bMs = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0
      return bMs - aMs
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
}

function handleConversationStreamError(error) {
    console.error('Failed to stream conversations:', error)
    console.debug('[ChatPanel] Conversation stream error details', {
      code: error?.code || null,
      message: error?.message || null,
      authUid: auth.currentUser?.uid || null,
      selectedConversationId: selectedConversationId.value || null,
    })
    if (error?.code === 'permission-denied' && !hasRetriedConversationStreamAfterAuthRefresh.value) {
      hasRetriedConversationStreamAfterAuthRefresh.value = true
      const currentUser = getCurrentUser()
      if (currentUser) {
        currentUser.getIdToken(true)
          .then(() => {
            if (auth.currentUser?.uid === currentUser.uid) {
              subscribeToConversations(currentUser.uid)
            }
          })
          .catch((refreshError) => {
            console.error('Failed to refresh auth token for conversation stream retry:', refreshError)
          })
      }
    }
    statusText.value = 'Failed to load conversations.'
    conversationsReady.value = true
}

function subscribeToConversations(uid) {
  stopConversationsListener()
  conversationsReady.value = false
  createdByConversationsCache = []
  ownerConversationsCache = []

  const createdByQuery = query(
    collection(db, 'conversations'),
    where('createdBy', '==', uid),
    orderBy('updatedAt', 'desc')
  )
  const ownerQuery = query(
    collection(db, 'conversations'),
    where('listingOwnerUid', '==', uid),
    orderBy('updatedAt', 'desc')
  )

  createdByConversationsUnsubscribe = onSnapshot(createdByQuery, (snapshot) => {
    const entries = []
    snapshot.forEach((conversationDoc) => {
      entries.push(normalizeConversation(conversationDoc))
    })
    createdByConversationsCache = entries
    applyMergedConversations()
  }, handleConversationStreamError)

  ownerConversationsUnsubscribe = onSnapshot(ownerQuery, (snapshot) => {
    const entries = []
    snapshot.forEach((conversationDoc) => {
      entries.push(normalizeConversation(conversationDoc))
    })
    ownerConversationsCache = entries
    applyMergedConversations()
  }, handleConversationStreamError)
}

async function prepareAuthForFirestore(user) {
  try {
    const token = await user.getIdToken()
    console.debug('[ChatPanel] Auth token ready for Firestore', {
      authUid: auth.currentUser?.uid || null,
      callbackUid: user.uid,
      hasToken: Boolean(token),
    })
  } catch (error) {
    console.error('Failed to resolve auth token before loading conversations:', error)
    statusText.value = 'Authentication is not ready. Please try again.'
    authReadyForFirestore.value = false
    return false
  }

  if (auth.currentUser?.uid !== user.uid) {
    authReadyForFirestore.value = false
    return false
  }

  authReadyForFirestore.value = true
  hasRetriedConversationStreamAfterAuthRefresh.value = false
  return true
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

function scrollMessagesToBottom() {
  const messagesContainer = messagesContainerRef.value
  if (!messagesContainer) {
    return
  }
  messagesContainer.scrollTop = messagesContainer.scrollHeight
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
      createdByName: currentUser.displayName || currentUser.email || 'User',
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

  if (isSelectedPeerBlockedByMe.value) {
    statusText.value = 'Unblock this user before sending messages.'
    return
  }

  if (isSelectedPeerBlockingMe.value) {
    statusText.value = 'This user blocked you. You cannot send messages.'
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

const currentUid = computed(() => getCurrentUser()?.uid || '')
const selectedPeerUid = computed(() => {
  if (!selectedConversationMeta.value || !currentUid.value) {
    return ''
  }

  const participantIds = Array.isArray(selectedConversationMeta.value.participantIds)
    ? selectedConversationMeta.value.participantIds
    : []
  return participantIds.find((participantUid) => participantUid !== currentUid.value) || ''
})

const chatLockedByBlock = computed(() =>
  isSelectedPeerBlockedByMe.value || isSelectedPeerBlockingMe.value
)

const blockActionLabel = computed(() =>
  isSelectedPeerBlockedByMe.value ? 'Unblock User' : 'Block User'
)

function getConversationPeerName(conversation) {
  if (conversation.createdBy === currentUid.value) {
    return conversation.listingOwnerName || 'User'
  }

  return conversation.createdByName || 'User'
}

async function refreshBlockState() {
  const currentUser = getCurrentUser()
  if (!currentUser || !selectedPeerUid.value) {
    isSelectedPeerBlockedByMe.value = false
    isSelectedPeerBlockingMe.value = false
    blockStateReady.value = true
    return
  }

  blockStateReady.value = false
  try {
    const [blockedByMeSnapshot, blockedMeSnapshot] = await Promise.all([
      getDoc(doc(db, 'users', currentUser.uid, 'chat-blocks', selectedPeerUid.value)),
      getDoc(doc(db, 'users', selectedPeerUid.value, 'chat-blocks', currentUser.uid)),
    ])

    isSelectedPeerBlockedByMe.value = blockedByMeSnapshot.exists()
    isSelectedPeerBlockingMe.value = blockedMeSnapshot.exists()
  } catch (error) {
    console.error('Failed to load block status:', error)
    statusText.value = 'Failed to load chat safety status.'
    isSelectedPeerBlockedByMe.value = false
    isSelectedPeerBlockingMe.value = false
  } finally {
    blockStateReady.value = true
  }
}

async function toggleSelectedPeerBlock() {
  const currentUser = getCurrentUser()
  if (!currentUser || !selectedPeerUid.value) {
    return
  }

  try {
    if (isSelectedPeerBlockedByMe.value) {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'chat-blocks', selectedPeerUid.value))
      statusText.value = 'User unblocked.'
    } else {
      await setDoc(doc(db, 'users', currentUser.uid, 'chat-blocks', selectedPeerUid.value), {
        blockedUid: selectedPeerUid.value,
        createdAt: serverTimestamp(),
      })
      statusText.value = 'User blocked. You will not be able to send messages in this chat.'
    }
  } catch (error) {
    console.error('Failed to update block status:', error)
    statusText.value = 'Failed to update block status.'
  }

  await refreshBlockState()
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
  if (!currentUser || !authReadyForFirestore.value) {
    console.debug('[ChatPanel] Skipping route-start; auth not ready', {
      hasCurrentUser: Boolean(currentUser),
      authReadyForFirestore: authReadyForFirestore.value,
      authUid: auth.currentUser?.uid || null,
      cachedUid: currentUser?.uid || null,
      routeQuery: route.query,
    })
    return
  }

  const startPayload = readStartPayloadFromRoute()
  if (!startPayload) {
    console.debug('[ChatPanel] No route-start payload present', { routeQuery: route.query })
    return
  }

  const routeStartKey = `${startPayload.listingId}__${startPayload.listingOwnerUid}`
  if (lastStartedFromRouteKey.value === routeStartKey) {
    console.debug('[ChatPanel] Route-start skipped; already started', { routeStartKey })
    return
  }

  console.debug('[ChatPanel] Attempting route-start conversation', {
    authUid: auth.currentUser?.uid || null,
    cachedUid: currentUser.uid,
    startPayload,
  })
  await ensureConversation(startPayload)
  lastStartedFromRouteKey.value = routeStartKey
  router.replace({ path: '/chat' }).catch(() => {})
}

onMounted(() => {
  window.addEventListener('p2h:start-chat', handleStartChat)

  authUnsubscribe = auth.onAuthStateChanged((user) => {
    setCurrentUser(user || null)
    isLoggedIn.value = Boolean(user)
    authReadyForFirestore.value = false
    statusText.value = ''

    stopMessagesListener()
    messages.value = []
    selectedConversationId.value = ''
    selectedConversationMeta.value = null

    if (!user) {
      lastStartedFromRouteKey.value = ''
      hasRetriedConversationStreamAfterAuthRefresh.value = false
      stopConversationsListener()
      resetChatState()
      return
    }

    prepareAuthForFirestore(user)
      .then((ready) => {
        if (!ready || auth.currentUser?.uid !== user.uid) {
          console.debug('[ChatPanel] Conversation subscribe skipped after auth prep', {
            ready,
            authUid: auth.currentUser?.uid || null,
            callbackUid: user.uid,
          })
          return
        }

        console.debug('[ChatPanel] Subscribing to conversations', {
          authUid: auth.currentUser?.uid || null,
          subscribeUid: user.uid,
        })
        subscribeToConversations(user.uid)
        return maybeStartConversationFromRoute()
      })
      .catch((error) => {
        console.error('Failed to initialize chat session:', error)
        statusText.value = 'Failed to load chat.'
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

watch(
  [selectedConversationId, selectedPeerUid, currentUid],
  () => {
    refreshBlockState().catch((error) => {
      console.error('Failed to refresh block status:', error)
      statusText.value = 'Failed to load chat safety status.'
    })
  },
  { immediate: true }
)

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    scrollMessagesToBottom()
  }
)

watch(
  () => selectedConversationId.value,
  async () => {
    await nextTick()
    scrollMessagesToBottom()
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('p2h:start-chat', handleStartChat)
  stopMessagesListener()
  stopConversationsListener()
  if (authUnsubscribe) {
    authUnsubscribe()
  }
})
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
          <span class="chat-conversation-title">{{ getConversationPeerName(conversation) }}</span>
          <span class="chat-conversation-location">{{ conversation.listingAddress }}</span>
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
        <div v-if="selectedConversationId && selectedPeerUid" class="chat-action-row">
          <button
            class="button is-small is-light"
            :disabled="!blockStateReady"
            @click="toggleSelectedPeerBlock"
          >
            {{ blockActionLabel }}
          </button>
          <p v-if="isSelectedPeerBlockingMe" class="is-size-7 chat-block-warning">
            This user blocked you. Sending is disabled.
          </p>
          <p v-else-if="isSelectedPeerBlockedByMe" class="is-size-7 chat-block-warning">
            You blocked this user. Sending is disabled.
          </p>
        </div>

        <div ref="messagesContainerRef" class="chat-messages">
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
              :disabled="!selectedConversationId || chatLockedByBlock"
              @keydown.enter.exact.prevent="sendMessage"
            />
          </div>
        </div>

        <button
          class="button is-primary"
          :disabled="!selectedConversationId || !draftMessage.trim() || chatLockedByBlock"
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

.chat-conversation-location {
  font-size: 0.78rem;
  color: #5f5f5f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.chat-main {
  display: flex;
  flex-direction: column;
}

.chat-action-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.chat-block-warning {
  color: #8f2a2a;
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
