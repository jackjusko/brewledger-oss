<template>
  <div class="landing-page landing-b scroll-smooth">
    <!-- Nav -->
    <nav class="fixed top-0 w-full z-50 bg-white/85 backdrop-blur border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link to="/" class="flex items-center gap-2">
            <img src="/logo.png" alt="BrewLedger" class="w-12 h-12 object-contain" />
            <span class="font-black text-lg tracking-tight text-stone-900">BrewLedger</span>
          </router-link>
          <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#console" class="hover:text-amber-700 transition">Console</a>
            <a href="#workflows" class="hover:text-amber-700 transition">Workflows</a>
            <a href="#alignment" class="hover:text-amber-700 transition">Finance</a>
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
      <section class="pt-12 pb-20 lg:pt-16 lg:pb-28 bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-12 gap-10 items-center">
            <div class="lg:col-span-6 space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                Powerful · Versatile · Easy
              </div>
              <h1 class="text-4xl sm:text-5xl font-black leading-tight text-stone-900">
                One platform for production, finance, and compliance.
              </h1>
              <p class="text-lg text-slate-600 leading-relaxed">
                BrewLedger unifies the desktop console, offline mobile app, finance-ready exports, and an AI assistant that performs tasks. Every role works from the same source of truth.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
                  Book a demo
                </button>
                <a href="#workflows" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
                  View workflows
                </a>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div class="bg-slate-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                  <div class="text-amber-500 text-lg mb-1">📒</div>
                  <div class="font-semibold">Immutable ledger</div>
                  <p class="text-xs text-slate-500">Receives, consumes, transfers, counts, packaging.</p>
                </div>
                <div class="bg-slate-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                  <div class="text-amber-500 text-lg mb-1">🤖</div>
                  <div class="font-semibold">AI tasks</div>
                  <p class="text-xs text-slate-500">Par levels, on-hand, readings, forecasts.</p>
                </div>
              </div>
            </div>

            <!-- Console + Carousel -->
            <div class="lg:col-span-6 grid md:grid-cols-2 gap-4 items-end">
              <div class="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-semibold text-sm text-slate-200">Desktop console</div>
                  <span class="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Live</span>
                </div>
                <div class="space-y-3 text-sm text-slate-200">
                  <div class="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <div>
                      <div class="font-semibold text-white">Inventory ledger</div>
                      <p class="text-xs text-slate-300">Who, what, where, why—always traceable</p>
                    </div>
                    <span class="text-emerald-200 font-semibold">Balanced</span>
                  </div>
                  <div class="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <div>
                      <div class="font-semibold text-white">Finance exports</div>
                      <p class="text-xs text-slate-300">Receipts, adjustments, packaging with cost</p>
                    </div>
                    <span class="text-amber-200 font-semibold">Queued</span>
                  </div>
                  <div class="bg-white/5 rounded-lg p-3">
                    <div class="text-xs text-slate-300 mb-1">Assistant actions</div>
                    <ul class="space-y-1 text-slate-100">
                      <li>• Set par: Citra Freezer → 5</li>
                      <li>• Record gravity: Batch 214 at 1.012</li>
                      <li>• Adjust base malt: +40 lbs (Grain Room)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="relative flex justify-center">
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-[220px] h-[380px] bg-amber-200/30 rounded-[2rem] blur-3xl"></div>
                </div>
                <button @click="moveSlide(-1)" aria-label="Previous slide" class="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/80 backdrop-blur border border-stone-200 rounded-full hover:bg-white transition text-stone-800 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button @click="moveSlide(1)" aria-label="Next slide" class="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/80 backdrop-blur border border-stone-200 rounded-full hover:bg-white transition text-stone-800 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <div class="phone-frame relative w-[240px] h-[460px] bg-white border border-stone-200 rounded-[1.6rem] p-2 shadow-lg shadow-amber-900/10">
                  <div class="w-full h-full bg-white rounded-[1.2rem] overflow-hidden border border-stone-100">
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
        </div>
      </section>

      <!-- Console -->
      <section id="console" class="py-20 bg-slate-50 border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div class="text-center space-y-2">
            <p class="text-sm font-semibold text-amber-700 uppercase">Console clarity</p>
            <h2 class="text-3xl font-black text-stone-900">Readable, filterable, export-ready.</h2>
            <p class="text-lg text-slate-600 max-w-3xl mx-auto">Ledger detail, batch tracking, yield, and COGS in a calm interface tuned for managers and operators.</p>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">📒</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Trace everything</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Every receive, consume, transfer, count, and packaging run is auditable with who/when/why.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">📊</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Ready for finance</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Exports reflect real costs and movements—no double entry.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">📦</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Batch + vessel aware</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Readings, volumes, and packaging tied to the right batch and vessel across locations.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Workflows -->
      <section id="workflows" class="py-20 bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div class="space-y-2 text-center">
            <p class="text-sm font-semibold text-amber-700 uppercase">Versatile workflows</p>
            <h2 class="text-3xl font-black text-stone-900">Built for every role on the floor.</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div class="text-amber-500 text-lg">🍺</div>
              <h3 class="font-bold text-lg text-stone-900">Production</h3>
              <p class="text-slate-600 text-sm">Log readings, vessels, and packaging runs with automatic ledger links.</p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div class="text-amber-500 text-lg">🚨</div>
              <h3 class="font-bold text-lg text-stone-900">Inventory & par</h3>
              <p class="text-slate-600 text-sm">Par levels per location, alerts before stock-outs, clean adjustments.</p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div class="text-amber-500 text-lg">🧾</div>
              <h3 class="font-bold text-lg text-stone-900">Compliance</h3>
              <p class="text-slate-600 text-sm">Audit-grade ledger for TTB and internal reviews—no missing steps.</p>
            </div>
          </div>
          <div class="bg-slate-900 text-white rounded-2xl p-10 flex flex-col md:flex-row justify-between gap-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-black">Plan → Run → Sync</h3>
              <p class="text-slate-200">Plan inventory, run production from mobile, review and sync on desktop with finance.</p>
              <ul class="text-sm text-slate-200 space-y-1">
                <li>• Plan: map items, par levels, locations</li>
                <li>• Run: receipts, transfers, readings, packaging (offline OK)</li>
                <li>• Sync: review exceptions and export for accounting</li>
              </ul>
            </div>
            <div class="flex items-center gap-3">
              <button type="button" @click="openContactForm" class="px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition">
                Book a demo
              </button>
              <a href="#alignment" class="px-6 py-3 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition">
                See finance view
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Finance alignment -->
      <section id="alignment" class="py-20 bg-slate-50 border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-4">
            <p class="text-sm font-semibold text-amber-700 uppercase">Finance alignment</p>
            <h2 class="text-3xl font-black text-stone-900">Finance alignment that mirrors reality.</h2>
            <p class="text-lg text-slate-600 leading-relaxed">
              Map once, then post receipts, adjustments, and packaging with costs. No re-entry. No guessing at month-end.
            </p>
            <ul class="space-y-3 text-sm text-slate-700">
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Accurate item mapping and accounts.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Costs roll from ledger and batch activity.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Status you can trust: queued, ready, synced.</li>
            </ul>
          </div>
          <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="font-semibold text-stone-900">Finance exports</div>
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
      <section id="pricing" class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
            Straightforward pricing
          </div>
          <h2 class="text-3xl font-black text-stone-900">$49.99/mo. Unlimited users.</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            Full platform: desktop console, mobile app, AI assistant, TTB-ready ledger. No setup fees or contracts.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
              Book a demo
            </button>
            <a href="#workflows" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
              View workflows
            </a>
          </div>
          <p class="text-sm text-slate-500">Powerful, versatile, and easy—without per-seat math.</p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-900 text-white py-14 border-t border-slate-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-6 text-sm">
          <div>
            <div class="font-black text-lg">BrewLedger</div>
            <p class="text-slate-300 mt-2 max-w-md">Brewery operations that keep production, finance, and compliance aligned.</p>
          </div>
          <div class="flex gap-6 text-slate-300">
            <a href="#console" class="hover:text-amber-300 transition">Console</a>
            <a href="#workflows" class="hover:text-amber-300 transition">Workflows</a>
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
  background-color: #ffffff;
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
<template>
  <div class="landing-page landing-b scroll-smooth">
    <!-- Nav -->
    <nav class="fixed top-0 w-full z-50 bg-white/85 backdrop-blur border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link to="/" class="flex items-center gap-2">
            <img src="/logo.png" alt="BrewLedger" class="w-12 h-12 object-contain" />
            <span class="font-black text-lg tracking-tight text-stone-900">BrewLedger</span>
          </router-link>
          <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#console" class="hover:text-amber-700 transition">Console</a>
            <a href="#workflows" class="hover:text-amber-700 transition">Workflows</a>
            <a href="#trust" class="hover:text-amber-700 transition">Trust</a>
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
      <section class="pt-12 pb-20 lg:pt-16 lg:pb-28 bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-12 gap-10 items-center">
            <div class="lg:col-span-6 space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                Desktop console + mobile, in sync
              </div>
              <h1 class="text-4xl sm:text-5xl font-black leading-tight text-stone-900">
                Clear production, clean books, and an assistant that helps.
              </h1>
              <p class="text-lg text-slate-600 leading-relaxed">
                BrewLedger keeps your cellar team, console users, and finance on the same page. A modern ledger, finance-ready exports, and an AI assistant that performs tasks—not just answers questions.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
                  Book a demo
                </button>
                <a href="#console" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
                  Explore the console
                </a>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div class="bg-slate-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                  <div class="text-amber-500 text-lg mb-1">💻</div>
                  <div class="font-semibold">Desktop-first reporting</div>
                  <p class="text-xs text-slate-500">Filters, exports, and ledger detail.</p>
                </div>
                <div class="bg-slate-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                  <div class="text-amber-500 text-lg mb-1">🤝</div>
                  <div class="font-semibold">Finance alignment</div>
                  <p class="text-xs text-slate-500">Stop re-keying production data.</p>
                </div>
              </div>
            </div>

            <!-- Console + Carousel -->
            <div class="lg:col-span-6 grid md:grid-cols-2 gap-4 items-end">
              <div class="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-semibold text-sm text-slate-200">Desktop console</div>
                  <span class="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Live</span>
                </div>
                <div class="space-y-3 text-sm text-slate-200">
                  <div class="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <div>
                      <div class="font-semibold text-white">Inventory ledger</div>
                      <p class="text-xs text-slate-300">Recent receives, consumes, transfers</p>
                    </div>
                    <span class="text-emerald-200 font-semibold">Balanced</span>
                  </div>
                  <div class="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <div>
                      <div class="font-semibold text-white">Finance exports</div>
                      <p class="text-xs text-slate-300">Ready to post costs</p>
                    </div>
                    <span class="text-amber-200 font-semibold">Queued</span>
                  </div>
                  <div class="bg-white/5 rounded-lg p-3">
                    <div class="text-xs text-slate-300 mb-1">Assistant actions</div>
                    <ul class="space-y-1 text-slate-100">
                      <li>• Set par level: Citra (Freezer) → 5</li>
                      <li>• Log gravity for Batch 214</li>
                      <li>• Adjust base malt +40 lbs (Grain Room)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="relative flex justify-center">
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-[220px] h-[380px] bg-amber-200/30 rounded-[2rem] blur-3xl"></div>
                </div>
                <button @click="moveSlide(-1)" aria-label="Previous slide" class="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/80 backdrop-blur border border-stone-200 rounded-full hover:bg-white transition text-stone-800 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button @click="moveSlide(1)" aria-label="Next slide" class="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/80 backdrop-blur border border-stone-200 rounded-full hover:bg-white transition text-stone-800 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <div class="phone-frame relative w-[240px] h-[460px] bg-white border border-stone-200 rounded-[1.6rem] p-2 shadow-lg shadow-amber-900/10">
                  <div class="w-full h-full bg-white rounded-[1.2rem] overflow-hidden border border-stone-100">
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
        </div>
      </section>

      <!-- Console -->
      <section id="console" class="py-20 bg-slate-50 border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div class="text-center space-y-2">
            <p class="text-sm font-semibold text-amber-700 uppercase">Console clarity</p>
            <h2 class="text-3xl font-black text-stone-900">Built for managers, kind to operators.</h2>
            <p class="text-lg text-slate-600 max-w-3xl mx-auto">Readable tables, balanced contrast, and quick filters. Less shouting—more signal.</p>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">📒</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Ledger detail</h3>
              <p class="text-slate-600 text-sm leading-relaxed">See who did what, where, and why. Filters for location, batch, and transaction type.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">📊</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Reporting-ready</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Roll up costs, track yield, and export clean CSVs without extra cleanup.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">🔄</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Mobile ↔ desktop</h3>
              <p class="text-slate-600 text-sm leading-relaxed">Log on the floor, review on the console. Offline-first keeps work flowing.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Workflows -->
      <section id="workflows" class="py-20 bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div class="space-y-2 text-center">
            <p class="text-sm font-semibold text-amber-700 uppercase">Workflows that stick</p>
            <h2 class="text-3xl font-black text-stone-900">A few things you can rely on.</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div class="text-amber-500 text-lg">🤖</div>
              <h3 class="font-bold text-lg text-stone-900">Assistant tasks</h3>
              <p class="text-slate-600 text-sm">Set par levels, adjust on-hand, log readings, and forecast depletion through guarded actions.</p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div class="text-amber-500 text-lg">🔗</div>
              <h3 class="font-bold text-lg text-stone-900">Finance alignment</h3>
              <p class="text-slate-600 text-sm">Map once, export without rework. Keep finance synced to what happened on the floor.</p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
              <div class="text-amber-500 text-lg">🧭</div>
              <h3 class="font-bold text-lg text-stone-900">Compliance ready</h3>
              <p class="text-slate-600 text-sm">Audit-grade ledger with TTB-ready reporting when you need it.</p>
            </div>
          </div>
          <div class="bg-slate-900 text-white rounded-2xl p-10 flex flex-col md:flex-row justify-between gap-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-black">Built for production teams</h3>
              <p class="text-slate-200">Cellar, packaging, and owners share the same truth. Less chasing people, more running the brewery.</p>
            </div>
            <div class="flex items-center gap-3">
              <button type="button" @click="openContactForm" class="px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition">
                Book a demo
              </button>
              <a href="#console" class="px-6 py-3 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition">
                View console
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Trust -->
      <section id="trust" class="py-20 bg-slate-50 border-b border-slate-200">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div class="text-center space-y-2">
            <p class="text-sm font-semibold text-amber-700 uppercase">Trusted operations</p>
            <h2 class="text-3xl font-black text-stone-900">Quiet confidence, not loud promises.</h2>
          </div>
          <div class="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm space-y-4">
            <p class="text-lg text-stone-800 font-semibold">
              “We stopped guessing about inventory. BrewLedger keeps the cellar honest and made our accountant breathe easier.”
            </p>
            <p class="text-sm text-slate-600">Ops Lead, 15 BBL brewery</p>
          </div>
          <div class="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="font-semibold text-stone-900 mb-1">Offline-first</div>
              <p>Log work in the cooler; sync when back online.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="font-semibold text-stone-900 mb-1">TTB ready</div>
              <p>Audit trails and reporting that stand up to review.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="font-semibold text-stone-900 mb-1">Unlimited users</div>
              <p>Bring the whole team without per-seat math.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
            Straightforward pricing
          </div>
          <h2 class="text-3xl font-black text-stone-900">$49.99/mo. No fine print.</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            Full platform access: desktop console, mobile app, AI assistant, and support. No setup fees, no contracts, unlimited users.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
              Book a demo
            </button>
            <a href="#console" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
              See the console
            </a>
          </div>
          <p class="text-sm text-slate-500">We focus on clarity: your data, your team, your processes.</p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-900 text-white py-14 border-t border-slate-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-6 text-sm">
          <div>
            <div class="font-black text-lg">BrewLedger</div>
            <p class="text-slate-300 mt-2 max-w-md">Desktop console and mobile app that keep production, finance, and compliance aligned.</p>
          </div>
          <div class="flex gap-6 text-slate-300">
            <a href="#console" class="hover:text-amber-300 transition">Console</a>
            <a href="#workflows" class="hover:text-amber-300 transition">Workflows</a>
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
              <button type="button" @click="showContactForm = false" class="flex-1 px-4 py-3 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200 transition">
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
  background-color: #ffffff;
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
