<template>
  <div class="landing-page landing-c scroll-smooth">
    <!-- Nav -->
    <nav class="fixed top-0 w-full z-50 bg-white/85 backdrop-blur border-b border-stone-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link to="/" class="flex items-center gap-2">
            <img src="/logo.png" alt="BrewLedger" class="w-12 h-12 object-contain" />
            <span class="font-black text-lg tracking-tight text-stone-900">BrewLedger</span>
          </router-link>
          <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#assistant" class="hover:text-amber-700 transition">AI assistant</a>
            <a href="#ease" class="hover:text-amber-700 transition">Ease</a>
            <a href="#sync" class="hover:text-amber-700 transition">Finance</a>
            <a href="#pricing" class="hover:text-amber-700 transition">Pricing</a>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" @click="openContactForm" class="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 transition">
              Book a demo
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="pt-20">
      <!-- Hero -->
      <section class="pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-br from-white via-amber-50 to-slate-50 border-b border-stone-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-12 gap-10 items-center">
            <div class="lg:col-span-7 space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                Powerful · Versatile · Easy
              </div>
              <h1 class="text-4xl sm:text-5xl font-black leading-tight text-stone-900">
                The assistant that keeps your console and books in sync.
              </h1>
              <p class="text-lg text-slate-600 leading-relaxed max-w-2xl">
                BrewLedger’s AI performs real tasks, not just chat. Set par levels, adjust on-hand, record readings, and keep finance in step—while the console stays calm and the mobile app works offline.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
                  Book a demo
                </button>
                <a href="#assistant" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
                  See assistant in action
                </a>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-600">
                <div class="bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <div class="text-amber-500 text-lg">🤖</div>
                  <div class="font-semibold">Tasks, not chat</div>
                </div>
                <div class="bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <div class="text-amber-500 text-lg">🔗</div>
                  <div class="font-semibold">Finance-ready exports</div>
                </div>
                <div class="bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <div class="text-amber-500 text-lg">📱</div>
                  <div class="font-semibold">Offline mobile</div>
                </div>
                <div class="bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <div class="text-amber-500 text-lg">🧾</div>
                  <div class="font-semibold">TTB-ready</div>
                </div>
              </div>
            </div>

            <!-- Mobile Carousel -->
            <div class="lg:col-span-5 flex justify-center relative">
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-[280px] h-[480px] sm:w-[320px] sm:h-[560px] bg-amber-200/30 rounded-[2.5rem] blur-3xl"></div>
              </div>
              <button @click="moveSlide(-1)" aria-label="Previous slide" class="absolute left-0 lg:-left-8 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/80 backdrop-blur border border-stone-200 rounded-full hover:bg-white transition text-stone-800 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button @click="moveSlide(1)" aria-label="Next slide" class="absolute right-0 lg:-right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/80 backdrop-blur border border-stone-200 rounded-full hover:bg-white transition text-stone-800 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <div class="phone-frame relative w-[280px] h-[520px] sm:w-[340px] sm:h-[640px] bg-white border border-stone-200 rounded-[2rem] p-2 sm:p-3 shadow-xl shadow-amber-900/10 mx-auto">
                <div class="w-full h-full bg-white rounded-[1.4rem] overflow-hidden border border-stone-100">
                  <div ref="trackRef" class="carousel-track flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
                    <div v-for="n in 7" :key="n" class="phone-slide flex-shrink-0 h-full bg-white relative p-1">
                      <img
                        :src="`/screenshots/sc${n}.png`"
                        :alt="`BrewLedger Screen ${n}`"
                        class="block w-full h-full object-contain object-top rounded-lg"
                        loading="lazy"
                        @error="(e) => { e.target.style.display = 'none'; failedSlides[n] = true }"
                      />
                      <div v-if="failedSlides[n]" class="absolute inset-1 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-100 rounded-lg">
                        Screenshot {{ n }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                  <button
                    v-for="n in 7"
                    :key="n"
                    @click="goToSlide(n - 1)"
                    class="w-2 h-2 rounded-full transition-all"
                    :class="currentSlide === n - 1 ? 'bg-amber-500 w-4' : 'bg-stone-300 hover:bg-stone-400'"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Ease -->
      <section id="ease" class="py-20 bg-white border-b border-stone-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div class="space-y-3 text-center">
            <p class="text-sm font-semibold text-amber-700 uppercase">Easy to run</p>
            <h2 class="text-3xl font-black text-stone-900">Powerful, but approachable for every role.</h2>
            <p class="text-lg text-slate-600 max-w-3xl mx-auto">
              Calm UI, offline-first mobile, and guided actions. Managers get clarity, operators get speed.
            </p>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">⚡</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Quick start</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Map items and par levels once. Guided checklists keep setup simple.</p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">🤖</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">AI does the work</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Set par levels, adjust on-hand, log readings, forecast depletion—without digging through menus.</p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">👍</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Friendly UI</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Calm colors, balanced contrast, and clean cards from the 2026 desktop design system.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Assistant -->
      <section id="assistant" class="py-20 bg-slate-900 text-white border-b border-stone-900">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-4">
            <p class="text-sm font-semibold text-amber-300 uppercase">Tasks, not prompts</p>
            <h2 class="text-3xl sm:text-4xl font-black leading-tight">Tell it the outcome. It handles the steps.</h2>
            <p class="text-lg text-slate-200/90 leading-relaxed">
              Guarded actions keep data clean: set_par_level, adjust_onhand, record_batch_reading, adjust_batch_volume, forecast_item.
            </p>
            <ul class="space-y-3 text-sm text-slate-200">
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Par levels per location without leaving the floor.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Adjust on-hand and volumes with ledger entries.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Record readings on the right batch and vessel.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Forecast depletion from real usage to prevent stock-outs.</li>
            </ul>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div class="text-sm font-semibold text-amber-200 mb-3">Assistant task</div>
            <div class="space-y-3 text-sm bg-white/5 border border-white/10 rounded-xl p-4">
              <div class="text-amber-200 font-semibold">You</div>
              <p class="text-slate-100">“Raise par for Simcoe to 50 lbs in the freezer and set on-hand to 35 if needed.”</p>
              <div class="text-amber-200 font-semibold">Assistant</div>
              <ul class="text-slate-100 space-y-2">
                <li>• Updates par: 50 lbs (Freezer)</li>
                <li>• Detects on-hand 23; creates adjustment +12</li>
                <li>• Logs to ledger with who/when/why</li>
                <li>• Syncs back to the console</li>
              </ul>
              <div class="text-emerald-200 font-semibold">Done.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Mobile + desktop -->
      <section id="mobile" class="py-20 bg-white border-b border-stone-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-4">
            <p class="text-sm font-semibold text-amber-700 uppercase">Mobile + desktop</p>
            <h2 class="text-3xl font-black text-stone-900">Log on the floor, review on the console.</h2>
            <p class="text-lg text-slate-600 leading-relaxed">Offline-first for cellar and packaging, with a desktop console ready for reporting, exports, and TTB trails.</p>
            <ul class="space-y-3 text-sm text-slate-700">
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Offline in the cooler; sync when back online.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Par-aware by location; transfers stay auditable.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Yield and COGS stay tied to batches and vessels.</li>
            </ul>
          </div>
          <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="font-semibold text-stone-900">What teams see</div>
            <div class="grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div class="bg-white border border-stone-200 rounded-xl p-4">
                <div class="font-semibold text-stone-900 mb-1">Inventory ledger</div>
                <p>Receives, consumes, transfers, counts with reasons.</p>
              </div>
              <div class="bg-white border border-stone-200 rounded-xl p-4">
                <div class="font-semibold text-stone-900 mb-1">Batch tracking</div>
                <p>Gravity, pH, temps, packaging, vessels.</p>
              </div>
              <div class="bg-white border border-stone-200 rounded-xl p-4">
                <div class="font-semibold text-stone-900 mb-1">Par alerts</div>
                <p>Location-aware mins to prevent stock-outs.</p>
              </div>
              <div class="bg-white border border-stone-200 rounded-xl p-4">
                <div class="font-semibold text-stone-900 mb-1">Yield + COGS</div>
                <p>Actual vs theoretical usage and cost per batch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Finance alignment -->
      <section id="sync" class="py-20 bg-slate-50 border-b border-stone-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-4">
            <p class="text-sm font-semibold text-amber-700 uppercase">Finance alignment</p>
            <h2 class="text-3xl font-black text-stone-900">Finance alignment without re-entry.</h2>
            <p class="text-lg text-slate-600 leading-relaxed">Map once, then keep receipts, adjustments, and packaging costs in step with finance. Reduce end-of-month cleanup and keep production honest.</p>
            <ul class="space-y-3 text-sm text-slate-700">
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Accurate item mapping; avoid duplicate SKUs.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Costs roll up automatically from the ledger.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Clear status: queued, ready, synced.</li>
            </ul>
          </div>
          <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="font-semibold text-stone-900">Sync status</div>
              <span class="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Healthy</span>
            </div>
            <div class="space-y-2 text-sm text-slate-700">
              <div class="flex justify-between items-center">
                <span>Receipts logged for accounting</span>
                <span class="text-emerald-600 font-semibold">Synced</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Adjustments tracked with context</span>
                <span class="text-emerald-600 font-semibold">Synced</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Packaging cost rollup</span>
                <span class="text-emerald-600 font-semibold">Ready</span>
              </div>
              <p class="text-xs text-slate-500">Finance sees what actually happened in production.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="py-20 bg-slate-900 text-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-amber-200">
            Straightforward pricing
          </div>
          <h2 class="text-3xl font-black">$49.99/mo. Unlimited users.</h2>
          <p class="text-lg text-slate-200 max-w-2xl mx-auto">
            Full platform: desktop console, mobile app, AI assistant, TTB-ready ledger. No setup fees, no contracts.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" @click="openContactForm" class="px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition">
              Book a demo
            </button>
            <a href="#assistant" class="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition text-center">
              See assistant tasks
            </a>
          </div>
          <p class="text-sm text-slate-300">Powerful, versatile, and easy enough for every shift.</p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-6 text-sm">
          <div>
            <div class="font-black text-lg">BrewLedger</div>
            <p class="text-slate-300 mt-2 max-w-md">Assistant-powered operations across mobile and desktop, kept in sync for finance.</p>
          </div>
          <div class="flex gap-6 text-slate-300">
            <a href="#assistant" class="hover:text-amber-300 transition">Assistant</a>
            <a href="#mobile" class="hover:text-amber-300 transition">Mobile</a>
            <a href="#sync" class="hover:text-amber-300 transition">Finance</a>
            <button type="button" @click="openContactForm" class="hover:text-amber-300 transition">Book a demo</button>
          </div>
        </div>
      </footer>
    </main>

    <!-- Contact / Demo Request Form -->
    <Teleport to="body">
      <div v-if="showContactForm" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" @click.self="closeContactForm">
        <div class="bg-white border border-stone-200 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div v-if="contactSubmitted" class="text-center space-y-4">
            <div class="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
            <p class="text-xl font-black text-stone-900">Thanks for reaching out.</p>
            <p class="text-slate-600">We’ll send a short scheduling link so you can pick a time.</p>
            <button type="button" @click="closeContactForm" class="px-5 py-3 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition">
              Close
            </button>
          </div>
          <form v-else @submit.prevent="submitContactForm" class="space-y-4">
            <div class="space-y-1">
              <h3 class="text-2xl font-black text-stone-900">Book a demo</h3>
              <p class="text-slate-600 text-sm">Tell us a bit about your brewery. We’ll follow up quickly.</p>
            </div>
            <div class="space-y-4">
              <div>
                <label for="contact-name" class="block text-sm font-semibold text-stone-700 mb-1">Your Name *</label>
                <input id="contact-name" v-model="contactForm.name" type="text" required class="w-full p-3 border border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition" placeholder="Alex Brewer" />
              </div>
              <div>
                <label for="contact-email" class="block text-sm font-semibold text-stone-700 mb-1">Email *</label>
                <input id="contact-email" v-model="contactForm.email" type="email" required class="w-full p-3 border border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition" placeholder="you@yourbrewery.com" />
              </div>
              <div>
                <label for="contact-brewery" class="block text-sm font-semibold text-stone-700 mb-1">Brewery Name</label>
                <input id="contact-brewery" v-model="contactForm.brewery" type="text" class="w-full p-3 border border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition" placeholder="Acme Brewing Co." />
              </div>
              <div>
                <label for="contact-message" class="block text-sm font-semibold text-stone-700 mb-1">What would you like to cover?</label>
                <textarea id="contact-message" v-model="contactForm.message" rows="3" class="w-full p-3 border border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition resize-none" placeholder="Operations pain points, systems you use today..."></textarea>
              </div>
            </div>
            <div v-if="contactError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              {{ contactError }}
            </div>
            <div class="flex gap-3">
              <button type="button" @click="closeContactForm" class="flex-1 px-4 py-3 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200 transition">
                Cancel
              </button>
              <button type="submit" :disabled="contactLoading" class="flex-1 px-4 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition">
                {{ contactLoading ? 'Sending...' : 'Send request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useContactForm } from '../composables/useContactForm'

const {
  showContactForm,
  contactSubmitted,
  contactLoading,
  contactError,
  contactForm,
  openContactForm,
  closeContactForm,
  submitContactForm
} = useContactForm()

const trackRef = ref(null)
const currentSlide = ref(0)
const totalSlides = 7
const failedSlides = ref({})
let autoSlideInterval = null

function moveSlide(direction) {
  currentSlide.value = (currentSlide.value + direction + totalSlides) % totalSlides
  updateTrack()
  resetTimer()
}

function goToSlide(index) {
  currentSlide.value = index
  updateTrack()
  resetTimer()
}

function updateTrack() {
  if (trackRef.value) {
    const pct = (100 / totalSlides) * currentSlide.value
    trackRef.value.style.transform = `translateX(-${pct}%)`
  }
}

function startTimer() {
  autoSlideInterval = setInterval(() => {
    moveSlide(1)
  }, 4000)
}

function resetTimer() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval)
  }
  startTimer()
}

onMounted(() => {
  updateTrack()
  startTimer()
})

onUnmounted(() => {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval)
  }
})
</script>

<style scoped>
.landing-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  background-color: #f8fafc;
}

.landing-page ::selection {
  background-color: #0f172a;
  color: white;
}

.carousel-track {
  width: 700%;
}

.phone-slide {
  width: 14.285714%;
}
</style>
