<template>
  <div class="landing-page landing-a scroll-smooth">
    <!-- Nav -->
    <nav class="fixed top-0 w-full z-50 bg-white/85 backdrop-blur border-b border-stone-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link to="/" class="flex items-center gap-2">
            <img src="/logo.png" alt="BrewLedger" class="w-12 h-12 object-contain" />
            <span class="font-black text-lg tracking-tight text-stone-900">BrewLedger</span>
          </router-link>
          <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#power" class="hover:text-amber-700 transition">Power</a>
            <a href="#assistant" class="hover:text-amber-700 transition">AI</a>
            <a href="#finance" class="hover:text-amber-700 transition">Finance</a>
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
          <div class="grid lg:grid-cols-12 gap-12 items-center">
            <div class="lg:col-span-7 space-y-8">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                Powerful · Versatile · Easy
              </div>
              <div class="space-y-4">
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-stone-900 tracking-tight">
                  A powerful brewery console that stays easy to use.
                </h1>
                <p class="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                  BrewLedger combines an audit-grade ledger, task-capable AI, and finance-ready reporting. Run production, inventory, and compliance from one place—without trading power for simplicity.
                </p>
              </div>
              <div class="flex flex-col sm:flex-row gap-3">
                <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
                  Book a demo
                </button>
                <a href="#power" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
                  See how it works
                </a>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-slate-600">
                <div class="flex items-center gap-2 bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <span class="text-amber-500 text-lg">📒</span>
                  <span class="font-semibold">Audit-grade ledger</span>
                </div>
                <div class="flex items-center gap-2 bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <span class="text-amber-500 text-lg">🤖</span>
                  <span class="font-semibold">AI does tasks</span>
                </div>
                <div class="flex items-center gap-2 bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <span class="text-amber-500 text-lg">📑</span>
                  <span class="font-semibold">TTB-ready reporting</span>
                </div>
                <div class="flex items-center gap-2 bg-white/80 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                  <span class="text-amber-500 text-lg">📱</span>
                  <span class="font-semibold">Offline mobile</span>
                </div>
              </div>
            </div>

            <!-- Mobile Carousel -->
            <div class="lg:col-span-5 flex justify-center lg:justify-end relative">
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

      <!-- Power / Versatility / Ease -->
      <section id="power" class="py-20 bg-white border-b border-stone-100">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div class="space-y-3 text-center">
            <p class="text-sm font-semibold text-amber-700 uppercase">Powerful · Versatile · Easy</p>
            <h2 class="text-4xl font-black text-stone-900 tracking-tight">Built to handle the hard parts, easy for everyone.</h2>
            <p class="text-lg text-slate-600 max-w-3xl mx-auto">
              Desktop console for managers, mobile for the floor, and a ledger that keeps finance and compliance aligned.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">📊</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Powerful</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Full ledger history, batch tracking, yield, and COGS with filters and exports ready for reporting and audits.
              </p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">🧭</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Versatile</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Works for receives, consumes, transfers, counts, packaging, vessels, and TTB-ready reporting across locations.
              </p>
            </div>
            <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="text-amber-500 text-2xl mb-3">👍</div>
              <h3 class="font-bold text-xl text-stone-900 mb-2">Easy</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Offline-first mobile, calm UI, and AI actions that do the work—no shouting, no clutter, quick adoption for the team.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Assistant -->
      <section id="assistant" class="py-20 bg-slate-900 text-white border-b border-stone-900">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-4">
            <p class="text-sm font-semibold text-amber-300 uppercase">AI that executes</p>
            <h2 class="text-3xl sm:text-4xl font-black leading-tight">Tell it what you want. It does the task.</h2>
            <p class="text-lg text-slate-200/90 leading-relaxed">
              The assistant uses guarded actions to keep data clean. It can set par levels, adjust on-hand, record batch readings, adjust volumes, and forecast depletion.
            </p>
            <ul class="space-y-3 text-sm text-slate-200">
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Set par levels per location (set_par_level).</li>
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Adjust on-hand and volumes (adjust_onhand, adjust_batch_volume).</li>
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Record readings against batches (record_batch_reading).</li>
              <li class="flex gap-2 items-start"><span class="text-amber-300 mt-1">✓</span> Forecast depletion using real usage (forecast_item).</li>
            </ul>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div class="text-sm font-semibold text-amber-200 mb-3">Sample assistant task</div>
            <div class="space-y-3 text-sm bg-white/5 border border-white/10 rounded-xl p-4">
              <div class="text-amber-200 font-semibold">You</div>
              <p class="text-slate-100">“Set par to 5 bags of 2-row in Grain Room and adjust on-hand to 22 if needed.”</p>
              <div class="text-amber-200 font-semibold">Assistant</div>
              <ul class="text-slate-100 space-y-2">
                <li>• Updates par level to 5 (Grain Room)</li>
                <li>• Detects on-hand 18; creates adjustment +4</li>
                <li>• Logs to the ledger with who/when/why</li>
                <li>• Syncs to the desktop console</li>
              </ul>
              <div class="text-emerald-200 font-semibold">Done.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Finance alignment -->
      <section id="finance" class="py-20 bg-white border-b border-stone-100">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-4">
            <p class="text-sm font-semibold text-amber-700 uppercase">Finance & compliance</p>
            <h2 class="text-3xl font-black text-stone-900">Finance-ready exports and TTB reporting.</h2>
            <p class="text-lg text-slate-600 leading-relaxed">
              Keep finance confident and audits painless. Ledger trails and cost rollups keep receipts, adjustments, packaging, and reporting aligned.
            </p>
            <ul class="space-y-3 text-sm text-slate-700">
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Clean item mapping—no duplicate SKUs.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> Costs roll up automatically from batch + ledger activity.</li>
              <li class="flex gap-2 items-start"><span class="text-amber-500 mt-1">✓</span> TTB-ready trails: receives, consumes, transfers, counts.</li>
            </ul>
          </div>
          <div class="bg-slate-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div class="font-bold text-stone-800">Sync & reporting</div>
              <span class="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Healthy</span>
            </div>
            <div class="space-y-3 text-sm text-slate-700">
              <div class="flex justify-between items-center">
                <span>Receipts logged for finance</span>
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
              <p class="text-xs text-slate-500">Ledger history keeps finance, ops, and compliance aligned.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Works everywhere -->
      <section class="py-20 bg-slate-50 border-b border-stone-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div class="text-center space-y-2">
            <p class="text-sm font-semibold text-amber-700 uppercase">Works everywhere</p>
            <h2 class="text-3xl font-black text-stone-900">Desktop console + offline mobile, always in sync.</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="font-bold text-stone-900 mb-2">Offline-first</div>
              <p class="text-slate-600 text-sm">Log from the cooler and sync later. Your data stays safe on-device.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="font-bold text-stone-900 mb-2">Multi-location</div>
              <p class="text-slate-600 text-sm">Par levels and counts by storage area; transfers stay auditable.</p>
            </div>
            <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div class="font-bold text-stone-900 mb-2">Batch + vessel aware</div>
              <p class="text-slate-600 text-sm">Readings, moves, and packaging tied to the right batch and vessel.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing & CTA -->
      <section id="pricing" class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
            Straightforward pricing
          </div>
          <h2 class="text-3xl font-black text-stone-900">One price. Unlimited users.</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            $49.99/mo for the full platform—desktop console, mobile app, AI assistant, and support. No setup fees, no per-seat surprises.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" @click="openContactForm" class="px-6 py-3 bg-amber-500 text-stone-900 font-semibold rounded-lg shadow-sm hover:bg-amber-400 transition">
              Book a demo
            </button>
            <a href="#power" class="px-6 py-3 border border-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-50 transition text-center">
              See capabilities
            </a>
          </div>
          <p class="text-sm text-slate-500">Audit-grade ledger and task-capable AI in one place.</p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-900 text-white py-14 border-t border-stone-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-6 text-sm">
          <div>
            <div class="font-black text-lg">BrewLedger</div>
            <p class="text-slate-300 mt-2 max-w-md">Powerful, versatile, and easy brewery operations across mobile and desktop.</p>
          </div>
          <div class="flex gap-6 text-slate-300">
            <a href="#power" class="hover:text-amber-300 transition">Product</a>
            <a href="#pricing" class="hover:text-amber-300 transition">Pricing</a>
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
