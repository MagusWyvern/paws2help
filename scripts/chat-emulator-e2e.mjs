import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const projectId = 'paws2help'
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
}

async function resetEmulators() {
  const firestoreReset = await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: 'DELETE' }
  )
  if (!firestoreReset.ok) {
    throw new Error(`Failed to reset Firestore emulator: ${firestoreReset.status}`)
  }

  const authReset = await fetch(
    `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`,
    { method: 'DELETE' }
  )
  if (!authReset.ok) {
    throw new Error(`Failed to reset Auth emulator: ${authReset.status}`)
  }
}

function createClient(appName) {
  const app = initializeApp(firebaseConfig, appName)
  const auth = getAuth(app)
  const db = getFirestore(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  return { auth, db }
}

async function createAndSignIn(auth, email, password) {
  await createUserWithEmailAndPassword(auth, email, password)
  await signOut(auth)
  await signInWithEmailAndPassword(auth, email, password)
  return auth.currentUser
}

function logStep(name, data) {
  console.log(`[chat-e2e] ${name}`, data ?? '')
}

async function main() {
  await resetEmulators()

  const sender = createClient('sender-client')
  const receiver = createClient('receiver-client')

  const senderUser = await createAndSignIn(sender.auth, 'sender@example.com', 'password123')
  const receiverUser = await createAndSignIn(receiver.auth, 'receiver@example.com', 'password123')

  if (!senderUser || !receiverUser) {
    throw new Error('Failed to initialize test users')
  }

  logStep('users', { senderUid: senderUser.uid, receiverUid: receiverUser.uid })

  const listingId = 'listing-1'
  const conversationId = `${listingId}__${[senderUser.uid, receiverUser.uid].sort().join('__')}`
  const conversationRef = doc(sender.db, 'conversations', conversationId)

  const missingConversationReadBySender = await getDoc(conversationRef)
  logStep('missing conversation get by sender', { exists: missingConversationReadBySender.exists() })

  await setDoc(conversationRef, {
    listingId,
    listingAddress: 'Test Address',
    listingOwnerUid: receiverUser.uid,
    listingOwnerName: 'Receiver',
    participantIds: [senderUser.uid, receiverUser.uid].sort(),
    createdBy: senderUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageText: '',
    lastMessageSenderId: '',
  })
  logStep('conversation created', { conversationId })

  const senderConversationsQuery = query(
    collection(sender.db, 'conversations'),
    where('createdBy', '==', senderUser.uid),
    orderBy('updatedAt', 'desc')
  )
  const receiverConversationsQuery = query(
    collection(receiver.db, 'conversations'),
    where('listingOwnerUid', '==', receiverUser.uid),
    orderBy('updatedAt', 'desc')
  )

  const senderConversations = await getDocs(senderConversationsQuery)
  const receiverConversations = await getDocs(receiverConversationsQuery)
  logStep('conversation list results', {
    senderCount: senderConversations.size,
    receiverCount: receiverConversations.size,
  })

  const messageRef = collection(sender.db, 'conversations', conversationId, 'messages')
  await addDoc(messageRef, {
    senderId: senderUser.uid,
    senderName: 'Sender',
    text: 'Hello from sender',
    createdAt: serverTimestamp(),
  })

  await updateDoc(conversationRef, {
    updatedAt: serverTimestamp(),
    lastMessageText: 'Hello from sender',
    lastMessageSenderId: senderUser.uid,
  })
  logStep('message sent by sender')

  const receiverMessages = await getDocs(
    query(collection(receiver.db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'))
  )
  logStep('receiver message read', { count: receiverMessages.size })

  console.log('[chat-e2e] PASS')
}

main().catch((error) => {
  console.error('[chat-e2e] FAIL', {
    code: error?.code || null,
    message: error?.message || String(error),
  })
  process.exitCode = 1
})
