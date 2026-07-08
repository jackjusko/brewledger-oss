import { ref, reactive } from 'vue'
import { CONTACT_EMAIL } from '../config'

export function useContactForm() {
  const showContactForm = ref(false)
  const contactSubmitted = ref(false)
  const contactLoading = ref(false)
  const contactError = ref(null)
  const contactForm = reactive({
    name: '',
    email: '',
    brewery: '',
    message: ''
  })

  function resetContactState() {
    contactSubmitted.value = false
    contactError.value = null
    contactLoading.value = false
    contactForm.name = ''
    contactForm.email = ''
    contactForm.brewery = ''
    contactForm.message = ''
  }

  function openContactForm() {
    resetContactState()
    showContactForm.value = true
  }

  function closeContactForm() {
    showContactForm.value = false
    resetContactState()
  }

  async function submitContactForm() {
    contactLoading.value = true
    contactError.value = null

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          brewery: contactForm.brewery,
          message: contactForm.message
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send')
      }

      contactSubmitted.value = true
    } catch (e) {
      contactError.value = `Something went wrong. Please try again or email ${CONTACT_EMAIL} directly.`
      console.error('Contact form error:', e)
    } finally {
      contactLoading.value = false
    }
  }

  return {
    showContactForm,
    contactSubmitted,
    contactLoading,
    contactError,
    contactForm,
    openContactForm,
    closeContactForm,
    submitContactForm,
    resetContactState
  }
}
