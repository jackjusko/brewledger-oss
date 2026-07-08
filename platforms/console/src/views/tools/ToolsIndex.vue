<template>
  <div class="tools-index max-w-3xl">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Brewery Tools</h1>
    <p class="text-slate-600 dark:text-neutral-400 mb-8">
      Free utilities for production managers and brewery operators. No login required.
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <router-link
        to="/tools/bbl-to-case"
        class="block rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 p-5 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">BBL to Case Converter</h2>
        <p class="text-sm text-slate-600 dark:text-neutral-400">
          Yield-adjusted pack-out calculator: split batches across formats, estimate materials (cans, lids, flats), and revenue.
        </p>
        <span class="inline-block mt-3 text-sm font-semibold text-amber-600 dark:text-amber-400">Use tool →</span>
      </router-link>

      <router-link
        to="/tools/csv-search"
        class="block rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 p-5 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">CSV Search</h2>
        <p class="text-sm text-slate-600 dark:text-neutral-400">
          Load a CSV from a URL or upload a file to view and search it.
        </p>
        <span class="inline-block mt-3 text-sm font-semibold text-amber-600 dark:text-amber-400">Use tool →</span>
      </router-link>
    </div>
  </div>
</template>
