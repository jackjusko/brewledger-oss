<template>
  <div class="landing-page scroll-smooth">
    <!-- Nav -->
    <nav class="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <router-link to="/" class="flex items-center gap-2">
            <img src="/logo.png" alt="BrewLedger" class="w-16 h-16 object-contain" />
            <span class="font-bold text-xl tracking-tight text-stone-800">BrewLedger</span>
          </router-link>
          <div class="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#screenshots" class="hover:text-amber-700 transition">Screens</a>
            <a href="#platform" class="hover:text-amber-700 transition">Platform</a>
            <a href="#workflows" class="hover:text-amber-700 transition">Workflows</a>
            <a href="#pricing" class="hover:text-amber-700 transition">Pricing</a>
            <router-link to="/tools" class="hover:text-amber-700 transition">Tools</router-link>
            <a href="/tools" class="hover:text-amber-700 transition">Tools</a>
          </div>
          <div class="flex items-center gap-3">
            <router-link to="/login" class="px-4 py-2 text-amber-700 font-medium hover:text-amber-800 transition text-sm">
              Login
            </router-link>
            <router-link to="/register" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold rounded-lg text-sm transition">
              Get started
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="pt-20">
      <!-- Hero -->
      <section class="pt-10 pb-20 lg:pt-16 lg:pb-24 overflow-hidden bg-stone-800 text-white border-b border-stone-700">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
              <h1 class="text-5xl lg:text-6xl font-bold leading-tight mb-8 tracking-tight">
                The <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">brewery management software</span><br>
                breweries actually want.
              </h1>

              <p class="text-xl text-stone-300 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                One place for <strong class="text-white">brewery inventory management</strong>, production, compliance, and taproom. Powerful brewery software—on the floor and at the desk. Mobile app and desktop console, always in sync.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <router-link to="/register" class="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-lg shadow-lg shadow-amber-500/20 transition-all text-center rounded-lg">
                  Get started for free
                </router-link>
                <a href="#screenshots" class="px-8 py-4 border border-stone-600 hover:bg-stone-700 rounded-lg font-medium text-stone-200 transition text-center">
                  See the platform
                </a>
              </div>

              <p class="mt-6 text-sm text-stone-400 font-medium">
                <button type="button" @click="showContactForm = true" class="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition">
                  Book a demo
                </button>
              </p>
              <p class="mt-2 text-sm text-stone-400 font-medium">
                See the platform in action below — mobile and desktop.
              </p>

              <div class="mt-12 grid grid-cols-4 gap-4 border-t border-stone-600 pt-8 max-w-xl mx-auto">
                <div>
                  <div class="text-2xl font-bold text-amber-400">📱</div>
                  <div class="text-xs font-medium text-stone-400 mt-1">Mobile app</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-amber-400">💻</div>
                  <div class="text-xs font-medium text-stone-400 mt-1">Desktop console</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-amber-400">🔄</div>
                  <div class="text-xs font-medium text-stone-400 mt-1">Real-time sync</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-amber-400">⚡</div>
                  <div class="text-xs font-medium text-stone-400 mt-1">Works offline</div>
                </div>
              </div>
          </div>
        </div>
      </section>

      <!-- See it in action: first section below hero (large mobile + desktop) -->
      <section id="screenshots" class="py-24 bg-stone-100 border-b border-stone-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-stone-800 mb-4 tracking-tight">See it in action</h2>
            <p class="text-xl text-slate-600 max-w-2xl mx-auto">Mobile on the floor, desktop in the office—same data, real-time sync.</p>
            <p class="text-sm font-medium text-amber-700 mt-3 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 flex-shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
              Click any screenshot to view full size
            </p>
          </div>
          <div class="flex flex-col gap-20 lg:gap-24 items-center">
            <!-- Mobile: phone mockup with balanced aspect ratio -->
            <div class="flex flex-col items-center w-full">
              <p class="text-sm font-semibold text-amber-800 mb-3">Mobile app</p>
              <p class="text-slate-600 text-sm mb-4 text-center max-w-md">Log from the cellar, taproom, or cooler—even offline.</p>
              <div class="relative w-full max-w-[280px] mx-auto">
                <button @click="moveSlide(-1)" aria-label="Previous slide" class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 p-2 bg-white/90 border border-stone-200 rounded-full hover:bg-white shadow text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <button @click="moveSlide(1)" aria-label="Next slide" class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 p-2 bg-white/90 border border-stone-200 rounded-full hover:bg-white shadow text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                <div
                  class="phone-frame relative w-full mx-auto bg-stone-800 rounded-[1.75rem] p-2 shadow-2xl border-2 border-stone-700 cursor-pointer group"
                  style="aspect-ratio: 9/17;"
                  role="button"
                  tabindex="0"
                  aria-label="Click to enlarge screenshot"
                  @click="openLightbox('mobile', currentSlide)"
                  @keydown.enter.prevent="openLightbox('mobile', currentSlide)"
                  @keydown.space.prevent="openLightbox('mobile', currentSlide)"
                >
                  <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                      Click to enlarge
                    </span>
                  </div>
                  <div class="absolute inset-2 rounded-[1.25rem] bg-black/0 group-hover:bg-black/30 transition-colors z-10 flex items-center justify-center pointer-events-none">
                    <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                      Click to enlarge
                    </span>
                  </div>
                  <div class="w-full h-full bg-white rounded-[1.25rem] overflow-hidden">
                    <div ref="trackRef" class="carousel-track flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
                      <div v-for="n in 7" :key="n" class="phone-slide flex-shrink-0 w-full h-full bg-white relative">
                        <img
                          :src="`/screenshots/sc${n}.png`"
                          :alt="`BrewLedger Screen ${n}`"
                          class="block w-full h-full object-cover object-top rounded-lg pointer-events-none"
                          loading="lazy"
                          @error="(e) => { e.target.style.display = 'none'; failedSlides[n] = true }"
                        />
                        <div v-if="failedSlides[n]" class="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-100 rounded-lg">Screenshot {{ n }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="text-sm text-amber-700 font-medium mt-3 text-center flex items-center justify-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                  Click to enlarge
                </p>
                <div class="flex gap-1.5 mt-3 justify-center">
                  <button v-for="n in 7" :key="n" @click="goToSlide(n - 1)" class="w-2 h-2 rounded-full transition-all" :class="currentSlide === n - 1 ? 'bg-amber-500 w-5' : 'bg-stone-300 hover:bg-stone-400'"></button>
                </div>
                <div class="mt-6 flex flex-col items-center gap-3">
                  <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider">Available on</p>
                  <div class="flex flex-wrap items-center justify-center gap-4">
                    <a :href="APP_STORE_URL" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-80 transition">
                      <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" class="h-14" />
                    </a>
                    <a :href="GOOGLE_PLAY_URL" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-80 transition">
                      <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" class="h-14" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <!-- Desktop: large browser mockup + carousel -->
            <div class="flex flex-col items-center w-full">
              <p class="text-sm font-semibold text-amber-800 mb-3">Desktop console</p>
              <p class="text-slate-600 text-sm mb-4 text-center max-w-md">Reporting, TTB forms, batches, and inventory—all in the desktop console.</p>
              <div class="w-full max-w-[960px] mx-auto relative">
                <button @click="goToDesktopSlide(Math.max(0, currentDesktopSlide - 1))" aria-label="Previous desktop slide" class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 p-2 bg-white/90 border border-stone-200 rounded-full hover:bg-white shadow text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <button @click="goToDesktopSlide(Math.min(desktopSlideCount - 1, currentDesktopSlide + 1))" aria-label="Next desktop slide" class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 p-2 bg-white/90 border border-stone-200 rounded-full hover:bg-white shadow text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                <div class="relative bg-stone-700 rounded-t-xl border-2 border-stone-600 border-b-0 shadow-2xl overflow-hidden">
                  <div class="flex items-center gap-2 px-4 py-3 border-b border-stone-600">
                    <span class="w-3 h-3 rounded-full bg-red-500"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span class="w-3 h-3 rounded-full bg-green-500"></span>
                    <span class="flex-1 text-center text-sm font-medium text-stone-400">BrewLedger Console</span>
                  </div>
                  <div
                    class="bg-white min-h-[520px] overflow-hidden cursor-pointer group relative"
                    style="aspect-ratio: 16/10;"
                    role="button"
                    tabindex="0"
                    aria-label="Click to enlarge screenshot"
                    @click="openLightbox('desktop', currentDesktopSlide)"
                    @keydown.enter.prevent="openLightbox('desktop', currentDesktopSlide)"
                    @keydown.space.prevent="openLightbox('desktop', currentDesktopSlide)"
                  >
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors z-10 flex items-center justify-center pointer-events-none">
                    <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                      Click to enlarge
                    </span>
                  </div>
                  <div ref="desktopTrackRef" class="desktop-carousel-track flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" :style="{ width: `${desktopSlideCount * 100}%` }">
                    <div v-for="n in desktopSlideCount" :key="n" class="desktop-slide flex-shrink-0 h-full bg-stone-50 relative" :style="{ flexBasis: `${100 / desktopSlideCount}%`, minWidth: `${100 / desktopSlideCount}%` }">
                      <img
                        :src="`/screenshots/desktop/dc${n}.png`"
                        :alt="`BrewLedger Desktop ${n}`"
                        class="block w-full h-full object-contain object-top pointer-events-none"
                        loading="lazy"
                        @error="(e) => { e.target.style.display = 'none'; failedDesktopSlides[n] = true }"
                      />
                      <div v-if="failedDesktopSlides[n]" class="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium bg-amber-50">Desktop {{ n }}</div>
                    </div>
                  </div>
                </div>
                </div>
                <p class="text-sm text-amber-700 font-medium mt-3 text-center flex items-center justify-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                  Click to enlarge
                </p>
                <div class="flex justify-center gap-2 mt-3">
                  <button v-for="n in desktopSlideCount" :key="n" @click="goToDesktopSlide(n - 1)" class="w-2 h-2 rounded-full transition-all" :class="currentDesktopSlide === n - 1 ? 'bg-amber-500 w-6' : 'bg-stone-300 hover:bg-stone-400'"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Platform: one source of truth -->
      <section id="platform" class="py-24 bg-stone-800 text-white border-b border-stone-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div class="inline-block px-4 py-1.5 bg-amber-500/20 border border-amber-400/40 font-medium text-sm mb-6 text-amber-200">
                One platform
              </div>
              <h2 class="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Your single source of truth.
              </h2>
              <p class="text-xl text-stone-300 font-medium mb-6 leading-relaxed">
                BrewLedger is <strong class="text-white">brewery management software</strong>—a full operations platform with brewery inventory management, batch tracking, recipes, compliance, and taproom serving. Item cost tracking and batch cost tracking give you true COGS; the ledger gives you an immutable audit trail. TTB reporting and serving costs for brewpubs and taprooms live in the same system. <strong class="text-white">Draft and packaged beer, one place.</strong>
              </p>
              <div class="space-y-6">
                <div class="flex gap-4 items-start">
                  <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-stone-900">✓</div>
                  <div>
                    <h4 class="font-bold text-lg">Completeness</h4>
                    <p class="text-slate-400">Full workflow from grain to glass—including TTB Form 5130.9, removals, and serving.</p>
                  </div>
                </div>
                <div class="flex gap-4 items-start">
                  <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-stone-900">✓</div>
                  <div>
                    <h4 class="font-bold text-lg">Reliability</h4>
                    <p class="text-slate-400">Every transaction tracked. No mystery adjustments; audit-ready when you need it.</p>
                  </div>
                </div>
                <div class="flex gap-4 items-start">
                  <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-stone-900">✓</div>
                  <div>
                    <h4 class="font-bold text-lg">Usability</h4>
                    <p class="text-slate-400">Powerful for the whole team—on the floor (mobile) and at the desk (desktop).</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ledger Mockup -->
            <div class="relative">
              <div class="absolute -inset-4 bg-amber-500 rounded-3xl transform rotate-2 opacity-20"></div>
              <div class="relative bg-white border-2 border-stone-600 rounded-3xl p-6 shadow-xl overflow-hidden">
                <div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <h3 class="text-xl font-bold text-stone-800">Transaction Ledger</h3>
                  <div class="flex gap-2">
                    <span class="w-3 h-3 rounded-full bg-red-400"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="w-3 h-3 rounded-full bg-green-400"></span>
                  </div>
                </div>
                <div class="space-y-3 font-medium text-sm">
                  <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-stone-900">Citra hops</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">Consume</span>
                      </div>
                      <div class="text-xs text-slate-500">Walk-in • 1/15/2026, 7:30 PM</div>
                    </div>
                    <span class="font-bold text-red-500 text-lg">-30</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-stone-900">Citra hops</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">Count Adjust</span>
                      </div>
                      <div class="text-xs text-slate-500">Walk-in • 1/15/2026, 7:28 PM</div>
                    </div>
                    <span class="font-bold text-red-500 text-lg">-7</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-stone-900">2-row malt</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 uppercase tracking-wide">Transfer In</span>
                      </div>
                      <div class="text-xs text-slate-500">Packaging • 1/15/2026, 7:28 PM</div>
                    </div>
                    <span class="font-bold text-emerald-500 text-lg">+100</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-stone-900">Citra hops</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">Receive</span>
                      </div>
                      <div class="text-xs text-slate-500">Walk-in • 1/15/2026, 7:27 PM</div>
                    </div>
                    <span class="font-bold text-emerald-500 text-lg">+33</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Benefits (downplayed) -->
      <section id="benefits" class="py-16 bg-amber-50/80 border-b border-amber-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-10">
            <h2 class="text-2xl font-bold text-stone-800 mb-2 tracking-tight">Benefits that add up</h2>
            <p class="text-slate-600 max-w-2xl mx-auto">Brewery inventory management that delivers: less waste, fewer stock-outs, true COGS, and time back—so you can focus on making great beer.</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div class="bg-white/90 border border-amber-200 rounded-xl p-5 text-center">
              <div class="text-2xl mb-2">📉</div>
              <h3 class="font-semibold text-stone-800 text-sm">Eliminate shrinkage</h3>
              <p class="text-slate-600 text-xs mt-1">Every move tracked</p>
            </div>
            <div class="bg-white/90 border border-amber-200 rounded-xl p-5 text-center">
              <div class="text-2xl mb-2">🛑</div>
              <h3 class="font-semibold text-stone-800 text-sm">Prevent stock-outs</h3>
              <p class="text-slate-600 text-xs mt-1">Par levels alert you</p>
            </div>
            <div class="bg-white/90 border border-amber-200 rounded-xl p-5 text-center">
              <div class="text-2xl mb-2">💵</div>
              <h3 class="font-semibold text-stone-800 text-sm">True COGS</h3>
              <p class="text-slate-600 text-xs mt-1">Per batch, per pint</p>
            </div>
            <div class="bg-white/90 border border-amber-200 rounded-xl p-5 text-center">
              <div class="text-2xl mb-2">⚡</div>
              <h3 class="font-semibold text-stone-800 text-sm">Save time</h3>
              <p class="text-slate-600 text-xs mt-1">Log from the floor</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Workflows -->
      <section id="workflows" class="py-24 bg-white border-b border-stone-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-stone-800 mb-4 tracking-tight">How it works</h2>
            <p class="text-xl text-slate-600 max-w-2xl mx-auto">Concrete workflows for production, inventory, taproom, and compliance—all in one platform.</p>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl mb-4 border border-amber-600">🍺</div>
              <h3 class="text-lg font-bold text-stone-800 mb-2">Production</h3>
              <p class="text-slate-600 text-sm font-medium leading-relaxed">Batches, vessels, recipes—grain to glass. Log knockout, pitch, readings, and packaging in one place.</p>
            </div>
            <div class="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl mb-4 border border-amber-600">📒</div>
              <h3 class="text-lg font-bold text-stone-800 mb-2">Inventory</h3>
              <p class="text-slate-600 text-sm font-medium leading-relaxed">Receive, locations, par levels, item and batch cost tracking. Audit-grade ledger so you always know what you have.</p>
            </div>
            <div class="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl mb-4 border border-amber-600">🍻</div>
              <h3 class="text-lg font-bold text-stone-800 mb-2">Serving & taproom</h3>
              <p class="text-slate-600 text-sm font-medium leading-relaxed">Serving tanks, pours, and costs for brewpubs and taprooms. Draft and packaged in one system.</p>
            </div>
            <div class="bg-stone-50 border border-stone-200 rounded-2xl p-6">
              <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl mb-4 border border-amber-600">📋</div>
              <h3 class="text-lg font-bold text-stone-800 mb-2">Compliance</h3>
              <p class="text-slate-600 text-sm font-medium leading-relaxed">TTB Form 5130.9, removals, racking, losses. Reports and exports when you need them.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Offline / Mobile + Desktop -->
      <section class="py-24 bg-stone-700 text-white border-b border-stone-600">
        <div class="max-w-5xl mx-auto px-4 text-center">
          <div class="w-20 h-20 bg-amber-500 rounded-2xl mx-auto mb-8 flex items-center justify-center text-4xl border border-amber-400">⚡</div>
          <h2 class="text-4xl lg:text-5xl font-bold mb-6">Works in the cooler.</h2>
          <p class="text-xl text-stone-200 font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
            <strong class="text-white">No signal? No problem.</strong> BrewLedger is designed for the thick walls of a brewery—the grain silo, the walk-in, the cellar. Data saves locally and syncs across your team when you're back online. <strong class="text-white">Never lose work. Never wait for a page to load.</strong>
          </p>
          <div class="grid md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
            <div class="bg-stone-700/50 border border-amber-500/30 rounded-xl p-6">
              <h3 class="font-bold text-lg mb-2 text-amber-200">Local-First</h3>
              <p class="text-stone-400 text-sm">Your data lives on your device first. The cloud is for sync, not dependency.</p>
            </div>
            <div class="bg-stone-700/50 border border-amber-500/30 rounded-xl p-6">
              <h3 class="font-bold text-lg mb-2 text-amber-200">Multi-Device Sync</h3>
              <p class="text-stone-400 text-sm">Changes made on one phone sync to your desktop console and other team members automatically.</p>
            </div>
            <div class="bg-stone-700/50 border border-amber-500/30 rounded-xl p-6">
              <h3 class="font-bold text-lg mb-2 text-amber-200">Zero Downtime</h3>
              <p class="text-stone-400 text-sm">If the server goes down, you keep working. Your data is safe and waiting to sync.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-24 bg-white border-b border-stone-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-stone-800 mb-4 tracking-tight">Built for breweries</h2>
            <p class="text-xl text-amber-800/90 font-medium max-w-2xl mx-auto">
              Brewery software that covers it all: ledger, batches, serving, TTB—one platform. No add-ons, no per-feature pricing.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 p-8 border border-amber-200 rounded-2xl bg-amber-50 relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10 text-9xl">🍺</div>
              <div class="relative z-10">
                <div class="flex items-center gap-4 mb-6">
                  <div class="w-12 h-12 bg-amber-100 text-amber-600 border border-stone-600 rounded-xl flex items-center justify-center text-2xl font-bold shadow-sm">🏷️</div>
                  <h3 class="text-2xl font-bold text-stone-800">Digital brew logs</h3>
                </div>
                <p class="text-slate-700 font-medium leading-relaxed mb-6 text-lg">
                  <strong>Stop chasing paper logs.</strong> Track your batches digitally from grain-in to glass. Log knockout volumes, gravity readings, vessel assignments, and packaging runs in real-time—all linked directly to your inventory usage.
                </p>
                <ul class="grid sm:grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                  <li class="flex items-center gap-2">✓ Milestone Tracking (Knockout, Pitch)</li>
                  <li class="flex items-center gap-2">✓ Readings (Gravity, pH, Temp)</li>
                  <li class="flex items-center gap-2">✓ Cellar Management (FV, Brite)</li>
                  <li class="flex items-center gap-2">✓ Ingredient Usage Linked to Batch</li>
                </ul>
              </div>
            </div>

            <div class="p-8 border border-amber-200 rounded-2xl bg-amber-50/50">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 border border-amber-300 rounded-xl flex items-center justify-center text-2xl mb-6 font-bold">📒</div>
              <h3 class="text-xl font-bold text-stone-800 mb-3">Inventory you can trust</h3>
              <p class="text-slate-600 font-medium leading-relaxed">
                <strong>Spreadsheets lie. The Ledger doesn't.</strong> Every move—Receiving malt, Pitching yeast, Kegging off—is permanently recorded.
              </p>
            </div>

            <div class="p-8 border border-amber-200 rounded-2xl bg-amber-50/50">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 border border-amber-300 rounded-xl flex items-center justify-center text-2xl mb-6 font-bold">🚨</div>
              <h3 class="text-xl font-bold text-stone-800 mb-3">Smart reordering</h3>
              <p class="text-slate-600 font-medium leading-relaxed">
                <strong>Never run out of Citra.</strong> Set location-specific minimums for your grain room and hop freezer. The app alerts you instantly when stock is low.
              </p>
            </div>

            <div class="p-8 border border-amber-200 rounded-2xl bg-amber-50/50">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 border border-amber-300 rounded-xl flex items-center justify-center text-2xl mb-6 font-bold">📊</div>
              <h3 class="text-xl font-bold text-stone-800 mb-3">Track yield & loss</h3>
              <p class="text-slate-600 font-medium leading-relaxed">
                <strong>Theoretical vs. Actual.</strong> Compare what your recipe said you used against what's actually gone. Spot efficiency issues instantly.
              </p>
            </div>

            <div class="p-8 border border-amber-200 rounded-2xl bg-amber-50/50">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 border border-amber-300 rounded-xl flex items-center justify-center text-2xl mb-6 font-bold">💵</div>
              <h3 class="text-xl font-bold text-stone-800 mb-3">Item & batch cost tracking</h3>
              <p class="text-slate-600 font-medium leading-relaxed">
                <strong>Know your cost per pint.</strong> Track costs at the item level and per batch—true COGS per batch, per beer, per package.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Built for Breweries Section -->
      <section class="py-20 bg-stone-700 text-white border-b border-stone-600">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-block px-4 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-200 text-sm font-medium mb-6">
            Complete brewery operations
          </div>
          <h2 class="text-4xl font-bold mb-6">Production, inventory, compliance, taproom—<span class="text-amber-300">one platform.</span></h2>
          <p class="text-xl text-stone-200 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            BrewLedger isn't just brewery inventory management—it's <strong class="text-white">brewery management software</strong> that connects your inventory, batches, recipes, and reporting. Everything speaks the same language: <strong class="text-white">batches, vessels, gravity readings, hop additions, packaging runs, and TTB compliance.</strong>
          </p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">📒</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Inventory Ledger</h4>
              <p class="text-stone-300 text-xs">Audit-grade tracking</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">🍺</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Batch Tracking</h4>
              <p class="text-stone-300 text-xs">Grain-in to glass</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">🏺</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Vessel Management</h4>
              <p class="text-stone-300 text-xs">FVs, brites, kegs</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">📋</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Recipe System</h4>
              <p class="text-stone-300 text-xs">Auto-deduct ingredients</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">🌿</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Ingredient Tracking</h4>
              <p class="text-stone-300 text-xs">Hops, grain, yeast, chem</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">📊</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Item & batch costs</h4>
              <p class="text-stone-300 text-xs">Cost tracking & reporting</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">🚨</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Par Levels & Alerts</h4>
              <p class="text-stone-300 text-xs">Never run out</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">🍻</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Serving & Taproom</h4>
              <p class="text-stone-300 text-xs">Tanks, pours, costs</p>
            </div>
            <div class="bg-stone-600/40 border border-stone-500 rounded-xl p-5">
              <div class="text-2xl mb-2">📍</div>
              <h4 class="font-semibold text-sm mb-1 text-white">Multi-Location</h4>
              <p class="text-stone-300 text-xs">Track by storage area</p>
            </div>
          </div>
          <p class="text-stone-400 text-sm">All included. No add-ons. No per-feature pricing.</p>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="py-24 bg-amber-50 border-b border-stone-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-stone-800 mb-4 tracking-tight">Simple pricing. Real value.</h2>
            <p class="text-xl text-slate-600 max-w-2xl mx-auto">No tiered plans. No per-user fees. No hidden costs. One price for everything.</p>
          </div>
          <div class="max-w-lg mx-auto">
            <div class="bg-white p-8 border-2 border-stone-300 shadow-lg rounded-2xl">
              <div class="mb-6">
                <span class="text-5xl font-bold text-stone-800">$49.99</span>
                <span class="text-slate-500 font-medium">/mo</span>
              </div>
              <p class="text-slate-600 font-medium mb-6">
                Includes <strong>everything</strong>: batch tracking, brewery inventory management, ledger, recipes, par levels, unlimited users, mobile app, and desktop console.
              </p>
              <ul class="space-y-2 text-sm font-bold text-slate-600 mb-8">
                <li class="flex items-center gap-2">✓ Full platform—inventory, batches, item & batch cost tracking, serving, TTB</li>
                <li class="flex items-center gap-2">✓ Unlimited users</li>
                <li class="flex items-center gap-2">✓ Offline-first mobile app</li>
                <li class="flex items-center gap-2">✓ Desktop management console</li>
                <li class="flex items-center gap-2">✓ No setup fees, no contracts. More affordable.</li>
              </ul>
              <router-link to="/register" class="block w-full py-4 bg-amber-600 text-white font-semibold text-center text-lg border border-amber-700 hover:bg-amber-700 transition rounded-lg cursor-pointer">
                Get started
              </router-link>
              <p class="mt-3 text-center">
                <button type="button" @click="showContactForm = true" class="text-sm text-amber-700 hover:text-amber-800 font-medium underline underline-offset-2">
                  or Book a demo
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="py-24 bg-white border-b border-stone-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-stone-800 mb-12 text-center tracking-tight">FAQ</h2>
          <div class="space-y-6">
            <div class="p-6 border border-stone-200 rounded-xl shadow-sm bg-stone-50/50">
              <h3 class="font-semibold text-lg text-stone-800 mb-2">Is BrewLedger brewery management software?</h3>
              <p class="text-slate-600 font-medium">Yes. BrewLedger is full brewery management software—brewery inventory management, batch tracking, serving, TTB compliance, and reporting. One place for production, cellar, taproom, and compliance. Mobile and desktop, always in sync.</p>
            </div>
            <div class="p-6 border border-stone-200 rounded-xl shadow-sm bg-stone-50/50">
              <h3 class="font-semibold text-lg text-stone-800 mb-2">What makes the Ledger different from a spreadsheet?</h3>
              <p class="text-slate-600 font-medium">The Ledger is an immutable, append-only transaction log. Unlike a spreadsheet where cells can be overwritten, every change in BrewLedger is a new entry with a timestamp and reason. You can always trace back how your inventory changed.</p>
            </div>
            <div class="p-6 border border-stone-200 rounded-xl shadow-sm bg-stone-50/50">
              <h3 class="font-semibold text-lg text-stone-800 mb-2">What does "offline-first" mean?</h3>
              <p class="text-slate-600 font-medium">Your data lives on your device and works without an internet connection. When you're back online, changes sync automatically. You never lose work, and the app is always fast—even in the cooler.</p>
            </div>
            <div class="p-6 border border-stone-200 rounded-xl shadow-sm bg-stone-50/50">
              <h3 class="font-semibold text-lg text-stone-800 mb-2">How many users can I add?</h3>
              <p class="text-slate-600 font-medium">Unlimited. There are no per-user fees. Add your entire cellar team, your owners, your accountant—everyone who needs access.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA / Footer -->
      <footer id="cta" class="bg-stone-700 text-white py-20 border-b border-stone-600">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            Brewery software that does it all. Production, inventory, compliance, taproom.
          </h2>
          <p class="text-xl text-stone-200 font-medium mb-10 max-w-2xl mx-auto">
            Get started for free today, or book a demo for a guided walkthrough.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <router-link to="/register" class="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-lg shadow-lg shadow-amber-500/20 transition-all rounded-lg cursor-pointer text-center">
              Get started for free
            </router-link>
            <button type="button" @click="showContactForm = true" class="px-8 py-4 border border-stone-500 hover:bg-stone-600 text-stone-200 font-semibold text-lg transition-all rounded-lg cursor-pointer">
              Book a demo
            </button>
          </div>
          <div class="border-t border-stone-600 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-stone-400">
            <div>&copy; 2026 BrewLedger Inc.</div>
            <div class="flex gap-6 mt-4 md:mt-0">
              <a href="#" class="hover:text-amber-300 transition">Privacy</a>
              <a href="#" class="hover:text-amber-300 transition">Terms</a>
              <a href="#" class="hover:text-amber-300 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>

    <!-- Contact / Demo Request Form -->
    <Teleport to="body">
      <div v-if="showContactForm" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" @click.self="showContactForm = false">
        <div class="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div v-if="contactSubmitted" class="text-center py-8">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <p class="text-xl font-bold text-stone-800 mb-2">Thanks!</p>
            <p class="text-slate-600 font-medium mb-6">We'll be in touch soon to schedule your demo.</p>
            <button type="button" @click="closeContactForm" class="px-6 py-3 bg-stone-700 text-white font-medium border border-stone-700 hover:bg-stone-600 transition rounded-lg text-sm">
              Close
            </button>
          </div>
          <form v-else @submit.prevent="submitContactForm">
            <h3 class="text-2xl font-bold text-stone-800 mb-2">Book a demo</h3>
            <p class="text-slate-600 font-medium mb-6">Tell us a bit about your brewery and we'll reach out to schedule a walkthrough.</p>
            
            <div class="space-y-4">
              <div>
                <label for="contact-name" class="block text-sm font-bold text-stone-700 mb-1">Your Name *</label>
                <input id="contact-name" v-model="contactForm.name" type="text" required class="w-full p-3 border-2 border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition" placeholder="Alex Brewer" />
              </div>
              <div>
                <label for="contact-email" class="block text-sm font-bold text-stone-700 mb-1">Email *</label>
                <input id="contact-email" v-model="contactForm.email" type="email" required class="w-full p-3 border-2 border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition" placeholder="you@yourbrewery.com" />
              </div>
              <div>
                <label for="contact-brewery" class="block text-sm font-bold text-stone-700 mb-1">Brewery Name</label>
                <input id="contact-brewery" v-model="contactForm.brewery" type="text" class="w-full p-3 border-2 border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition" placeholder="Acme Brewing Co." />
              </div>
              <div>
                <label for="contact-message" class="block text-sm font-bold text-stone-700 mb-1">Message</label>
                <textarea id="contact-message" v-model="contactForm.message" rows="3" class="w-full p-3 border-2 border-stone-200 rounded-lg focus:border-amber-500 focus:outline-none transition resize-none" placeholder="Tell us about your brewery or any questions you have..."></textarea>
              </div>
            </div>

            <div v-if="contactError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              {{ contactError }}
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" @click="showContactForm = false" class="flex-1 px-4 py-3 bg-stone-100 text-stone-700 font-medium border border-stone-200 hover:bg-stone-200 transition text-sm rounded-lg">
                Cancel
              </button>
              <button type="submit" :disabled="contactLoading" class="flex-1 px-4 py-3 bg-amber-600 text-white font-medium border border-amber-700 hover:bg-amber-700 disabled:opacity-50 transition text-sm rounded-lg">
                {{ contactLoading ? 'Sending...' : 'Send request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="lightboxImage"
        class="screenshot-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged screenshot"
        tabindex="-1"
        ref="lightboxEl"
        @click.self="closeLightbox"
        @keydown="onLightboxKeydown"
      >
        <button
          type="button"
          aria-label="Close"
          class="screenshot-lightbox-close"
          @click="closeLightbox"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <img
          v-if="lightboxImage"
          :src="lightboxImage.src"
          :alt="lightboxImage.alt"
          :class="['screenshot-lightbox-img', { 'screenshot-lightbox-img--desktop': lightboxImage.type === 'desktop' }]"
          @click.stop
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '../config'
import { useContactForm } from '../composables/useContactForm'

const {
  showContactForm,
  contactSubmitted,
  contactLoading,
  contactError,
  contactForm,
  closeContactForm,
  submitContactForm
} = useContactForm()

const trackRef = ref(null)
const currentSlide = ref(0)
const totalSlides = 7
const failedSlides = ref({})
let autoSlideInterval = null

// Desktop screenshot carousel (See it in action section)
const desktopTrackRef = ref(null)
const currentDesktopSlide = ref(0)
const desktopSlideCount = 3
const failedDesktopSlides = ref({})

const lightboxImage = ref(null)
const lightboxEl = ref(null)

function openLightbox(type, index) {
  const i = Number(index) + 1
  lightboxImage.value = {
    src: type === 'mobile' ? '/screenshots/sc' + i + '.png' : '/screenshots/desktop/dc' + i + '.png',
    alt: type === 'mobile' ? 'BrewLedger mobile screenshot ' + i : 'BrewLedger desktop screenshot ' + i,
    type: type
  }
  document.body.style.overflow = 'hidden'
  nextTick(() => { if (lightboxEl.value) lightboxEl.value.focus() })
}

function closeLightbox() {
  lightboxImage.value = null
  document.body.style.overflow = ''
}

function onLightboxKeydown(e) {
  if (e.key === 'Escape') closeLightbox()
}

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

function goToDesktopSlide(index) {
  currentDesktopSlide.value = index
  updateDesktopTrack()
}

function updateDesktopTrack() {
  if (desktopTrackRef.value) {
    const pct = (100 / desktopSlideCount) * currentDesktopSlide.value
    desktopTrackRef.value.style.transform = `translateX(-${pct}%)`
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
  updateDesktopTrack()
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
  @apply bg-amber-50 text-stone-900;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.landing-page ::selection {
  background-color: rgb(28 25 23);
  color: white;
}

/* Carousel: each slide = viewport width, track = 7 slides */
.carousel-track {
  width: 700%;
}

.phone-slide {
  width: 14.285714%; /* 100% / 7 */
}

.phone-slide img {
  width: 100%;
  height: 100%;
}

</style>

<style>
/* Lightbox (unscoped: content is in Teleport to body) */
.screenshot-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  padding: 1rem;
  outline: none;
}
.screenshot-lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border-radius: 9999px;
  background: #000;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.screenshot-lightbox-close:hover {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}
.screenshot-lightbox-close svg {
  flex-shrink: 0;
}
.screenshot-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* On mobile, rotate desktop (landscape) screenshot -90deg so it fits portrait phone */
@media (max-width: 768px) {
  .screenshot-lightbox-img--desktop {
    width: 100vh;
    max-width: none;
    height: auto;
    max-height: 100vw;
    transform: rotate(-90deg);
    object-fit: contain;
  }
}
</style>
