import { EventBus } from '../utils/EventBus.js'
import { streamDialogue } from '../api/ClaudeClient.js'
import { playUISound } from '../audio/UIAudio.js'

const modal      = document.getElementById('dialogue-modal')
const avatarEl   = document.getElementById('dialogue-avatar')
const nameEl     = document.getElementById('dialogue-name')
const roleEl     = document.getElementById('dialogue-role')
const textEl     = document.getElementById('dialogue-text')
const closeBtn   = document.getElementById('dialogue-close')
const nextBtn    = document.getElementById('dialogue-next')
const dismissBtn = document.getElementById('dialogue-dismiss')

let currentNPC = null
let isStreaming = false
let cancelStream = false

export function initDialogue() {
  EventBus.on('npc:interact', (npc) => openModal(npc))

  closeBtn?.addEventListener('click', closeModal)
  dismissBtn?.addEventListener('click', closeModal)
  nextBtn?.addEventListener('click', () => {
    if (currentNPC && !isStreaming) triggerNext()
  })

  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && modal.classList.contains('open')) closeModal()
  })
}

async function openModal(npc) {
  // Cancel any in-flight stream before opening a new one
  cancelStream = true
  currentNPC = npc

  // Apply character color — color arrives as '#rrggbb' string from NPCManager
  if (avatarEl) {
    avatarEl.textContent = npc.emoji
    avatarEl.style.background = npc.color + '22'
    avatarEl.style.border = `1px solid ${npc.color}44`
  }
  if (nameEl) {
    nameEl.textContent = npc.name
    nameEl.style.color = npc.color
  }
  if (roleEl) roleEl.textContent = npc.role

  if (textEl) textEl.innerHTML = ''

  modal.classList.add('open')
  await typeDialogue(npc.id)
}

async function typeDialogue(npcId) {
  if (!textEl) return
  isStreaming = true
  cancelStream = false

  textEl.innerHTML = '<span class="dialogue-cursor"></span>'

  try {
    for await (const chunk of streamDialogue(npcId)) {
      if (cancelStream) break
      // Remove cursor before appending text, re-add after
      const cur = textEl.querySelector('.dialogue-cursor')
      cur?.remove()
      textEl.innerHTML += escapeHtml(chunk)
      textEl.innerHTML += '<span class="dialogue-cursor"></span>'
    }
  } finally {
    isStreaming = false
    // Remove blinking cursor when done (or cancelled)
    setTimeout(() => {
      textEl.querySelector('.dialogue-cursor')?.remove()
    }, 1200)
  }
}

function triggerNext() {
  if (!currentNPC) return
  if (textEl) textEl.innerHTML = ''
  typeDialogue(currentNPC.id)
}

function closeModal() {
  cancelStream = true
  modal.classList.remove('open')
  playUISound('close')
  EventBus.emit('dialogue:close')
  currentNPC = null
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
