<template>
  <div class="ai-assistant-container">
    <div class="w-full">
      <!-- Header -->
      <div class="console-page-header mb-4">
        <div></div>
        <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-stone-400">
          <span class="px-2 py-1 rounded bg-neutral-100 dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700">Interactive</span>
          <span class="px-2 py-1 rounded bg-neutral-100 dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700">Widescreen</span>
          <span class="px-2 py-1 rounded bg-neutral-100 dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700">Split view</span>
        </div>
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-stone-700 flex gap-4" style="height: calc(100vh - 180px); min-height: 640px;">
        <!-- Chat Column -->
        <div class="flex flex-col basis-2/3 min-w-[420px] border-r border-neutral-200 dark:border-stone-700">
          <!-- Messages Area -->
          <div 
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-5 space-y-4"
          >
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center">
              <i class="ri-robot-2-line text-5xl text-neutral-300 dark:text-stone-500 mb-4 block" aria-hidden="true"></i>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Welcome to BrewLedger AI Assistant
              </h2>
              <p class="text-neutral-600 dark:text-stone-400 mb-6">
                Ask me anything about managing your brewery operations
              </p>
              <div class="flex flex-wrap gap-2 justify-center">
                <button
                  v-for="suggestion in suggestedPrompts"
                  :key="suggestion"
                  @click="sendSuggestedPrompt(suggestion)"
                  class="px-4 py-2 bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-stone-700 transition-colors text-sm"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-lg px-4 py-3 shadow-sm"
              :class="msg.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-neutral-100 dark:bg-stone-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700'"
            >
              <template v-if="msg.role === 'assistant'">
                <div v-if="msg.action" class="text-sm text-neutral-800 dark:text-neutral-100">
                  {{ msg.action.summary || msg.action.title || 'Assistant action suggested' }}
                </div>
                <MarkdownRenderer 
                  v-else
                  :content="msg.content"
                  class="break-words"
                />
              </template>
              <div 
                v-else
                class="whitespace-pre-wrap break-words"
              >{{ msg.content }}</div>
              <div
                v-if="msg.role === 'assistant' && msg.action && !msg.actionDismissed"
                class="mt-3 bg-white/70 dark:bg-stone-900/80 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-2"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {{ msg.action.title || 'Suggested action' }}
                    </div>
                    <p class="text-sm text-neutral-600 dark:text-stone-400">
                      {{ msg.action.summary || 'Run this action' }}
                    </p>
                  </div>
                  <button
                    class="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    @click="msg.actionDismissed = true"
                  >
                    Dismiss
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-60"
                    :disabled="actionStatuses[index]?.state === 'running'"
                    @click="runAction(msg.action, index)"
                  >
                    {{ actionStatuses[index]?.state === 'running' ? 'Running...' : 'Approve & run' }}
                  </button>
                  <div v-if="actionStatuses[index]?.state" class="text-xs text-neutral-600 dark:text-stone-400 flex items-center gap-1">
                    <span v-if="actionStatuses[index].state === 'success'" class="text-green-600 dark:text-green-400">✓</span>
                    <span v-else-if="actionStatuses[index].state === 'error'" class="text-red-600 dark:text-red-400">⚠</span>
                    <span v-else-if="actionStatuses[index].state === 'info'" class="text-amber-600 dark:text-amber-400">ℹ</span>
                    <span v-else-if="actionStatuses[index].state === 'need_location'" class="text-amber-600 dark:text-amber-400">?</span>
                    {{ actionStatuses[index].message || actionStatuses[index].state }}
                  </div>
                </div>
                <div v-if="actionStatuses[index]?.state === 'need_location'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].options?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select location:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].options"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyLocationAndRetry(index, 'single', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                  <div class="text-xs text-neutral-500 dark:text-stone-400">
                    Or set location name manually and approve & run.
                  </div>
                  <div v-if="actionStatuses[index].fromOptions?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select source:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].fromOptions"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyLocationAndRetry(index, 'from', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                  <div v-if="actionStatuses[index].toOptions?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select destination:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].toOptions"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyLocationAndRetry(index, 'to', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_recipe'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].recipes?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select recipe:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].recipes"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyRecipeOrVessel(index, 'recipe', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                  <div class="text-xs text-neutral-500 dark:text-stone-400">
                    Or continue without recipe:
                    <button
                      class="ml-2 px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      @click="applyRecipeOrVessel(index, 'recipe', { id: null, name: 'No recipe' })"
                    >
                      Skip recipe
                    </button>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_vessel'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].vessels?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select vessel:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].vessels"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyRecipeOrVessel(index, 'vessel', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_source'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].sources?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select source split:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].sources"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyOptionAndPrepare(index, 'source', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_destination'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].destinations?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select destination split:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].destinations"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyOptionAndPrepare(index, 'dest', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                  <div v-if="actionStatuses[index].vessels?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Or select destination vessel:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].vessels"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyRecipeOrVessel(index, 'vessel', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_batch'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].batches?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select batch:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].batches"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyOptionAndPrepare(index, 'batch', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_item'" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].items?.length">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Select item:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].items"
                        :key="opt.id"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyOptionAndPrepare(index, 'item', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_quantity' && actionStatuses[index]?.form" class="pt-2 space-y-2">
                  <label class="block text-xs text-neutral-600 dark:text-stone-400">Quantity</label>
                  <input
                    v-model="actionStatuses[index].form.quantity"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter quantity"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_volume' && actionStatuses[index]?.form" class="pt-2 space-y-2">
                  <label class="block text-xs text-neutral-600 dark:text-stone-400">Planned volume</label>
                  <input
                    v-model="actionStatuses[index].form.volume"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter volume"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_packaging_volume' && actionStatuses[index]?.form" class="pt-2 space-y-2">
                  <label class="block text-xs text-neutral-600 dark:text-stone-400">Packaged volume</label>
                  <input
                    v-model="actionStatuses[index].form.packagedVolume"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter packaged volume"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_item_name' && actionStatuses[index]?.form" class="pt-2 space-y-2">
                  <div v-if="actionStatuses[index].items?.length" class="mb-2">
                    <div class="text-xs text-neutral-600 dark:text-stone-400 mb-1">Or pick existing item:</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in actionStatuses[index].items"
                        :key="opt.id"
                        type="button"
                        class="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        @click="applyOptionAndPrepare(index, 'item', opt)"
                      >
                        {{ opt.name }}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs text-neutral-600 dark:text-stone-400 mb-1">New item name</label>
                    <input
                      v-model="actionStatuses[index].form.name"
                      type="text"
                      placeholder="Enter item name"
                      class="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-neutral-600 dark:text-stone-400 mb-1">Category</label>
                    <select
                      v-model="actionStatuses[index].form.category"
                      class="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="Other">Other</option>
                      <option value="Beer">Beer</option>
                      <option value="Wine">Wine</option>
                      <option value="Spirit">Spirit</option>
                      <option value="Ingredient">Ingredient</option>
                      <option value="Package">Package</option>
                    </select>
                  </div>
                </div>
                <div v-else-if="actionStatuses[index]?.state === 'need_location_name' && actionStatuses[index]?.form" class="pt-2 space-y-2">
                  <label class="block text-xs text-neutral-600 dark:text-stone-400">Location name</label>
                  <input
                    v-model="actionStatuses[index].form.name"
                    type="text"
                    placeholder="Enter location name"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div v-else-if="['need_quantity','need_volume','need_packaging_volume','need_item_name','need_location_name'].includes(actionStatuses[index]?.state)" class="pt-2 text-xs text-amber-600 dark:text-amber-400">
                  {{ actionStatuses[index]?.message || 'Provide the requested value, then approve & run.' }}
                </div>
              </div>
              <div v-if="msg.role === 'assistant' && msg.actionError" class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Action JSON could not be parsed: {{ msg.actionError }}
              </div>
              <div 
                class="text-xs mt-2 opacity-70"
                :class="msg.role === 'user' ? 'text-white' : 'text-neutral-500 dark:text-stone-400'"
              >
                {{ formatTime(msg.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-neutral-100 dark:bg-stone-800 rounded-lg px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <span class="text-sm text-neutral-600 dark:text-stone-400 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>

          <!-- Input Area -->
          <div class="border-t border-neutral-200 dark:border-stone-700 p-3 bg-neutral-50 dark:bg-stone-900/60">
            <form @submit.prevent="handleSubmit" class="flex gap-2">
              <input
                v-model="inputMessage"
                type="text"
                placeholder="Ask a question..."
                class="flex-1 px-3 py-3 bg-neutral-50 dark:bg-stone-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                :disabled="isLoading"
                ref="inputRef"
              />
              <button
                type="submit"
                :disabled="isLoading || !inputMessage.trim()"
                class="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </form>
            <div v-if="error" class="mt-3 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p class="text-sm text-danger-700 dark:text-danger-400">{{ error }}</p>
              <button
                @click="error = ''"
                class="mt-2 text-xs text-danger-600 dark:text-danger-400 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <!-- Action History Column -->
        <div class="flex-1 min-w-[320px] flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-stone-700">
            <div>
              <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Action history</div>
              <div class="text-xs text-neutral-500 dark:text-stone-400">Recent runs from this session</div>
            </div>
            <button
              class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              @click="actionHistory = []"
            >
              Clear
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div v-if="!actionHistory.length" class="text-sm text-neutral-500 dark:text-stone-400">
              No actions yet. Run an action from chat to see it here.
            </div>
            <div
              v-for="(entry, i) in actionHistory"
              :key="i"
              class="border border-neutral-200 dark:border-stone-700 rounded-lg p-3 bg-neutral-50/80 dark:bg-stone-900/60"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {{ entry.action.title || entry.action.intent }}
                  </div>
                  <div class="text-xs text-neutral-500 dark:text-stone-400">
                    {{ entry.action.summary || 'Action run' }}
                  </div>
                </div>
                <div class="text-xs text-neutral-500 dark:text-stone-400">
                  {{ formatTime(entry.timestamp) }}
                </div>
              </div>
              <div class="mt-2 text-sm">
                <span
                  :class="[
                    'mr-2 font-semibold',
                    entry.result?.status === 'success' ? 'text-green-600 dark:text-green-400' :
                    entry.result?.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-amber-600 dark:text-amber-400'
                  ]"
                >
                  {{ entry.result?.status || 'info' }}
                </span>
                <span class="text-neutral-700 dark:text-neutral-300">
                  {{ entry.result?.message || 'Completed' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { AIAssistantService } from '../services/AIAssistantService';
import { AssistantActionExecutor } from '../services/AssistantActionExecutor';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';

const messages = ref([]);
const inputMessage = ref('');
const isLoading = ref(false);
const error = ref('');
const messagesContainer = ref(null);
const inputRef = ref(null);
const actionStatuses = ref({});
const actionHistory = ref([]);
const pendingFollowups = ref({});

const suggestedPrompts = [
  'How do I add inventory?',
  'How do I create a batch?',
  'How do I track batch milestones?',
  'How do I manage recipes?',
];

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sendSuggestedPrompt = (prompt) => {
  inputMessage.value = prompt;
  handleSubmit();
};

const handleSubmit = async () => {
  const message = inputMessage.value.trim();
  if (!message || isLoading.value) return;

  // Add user message
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  });

  // Clear input
  inputMessage.value = '';
  isLoading.value = true;
  error.value = '';

  // Scroll to bottom
  await scrollToBottom();

  try {
    // Build conversation history (exclude timestamps for API)
    const conversationHistory = messages.value
      .slice(0, -1) // Exclude the message we just added
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    // Call AI service
    const response = await AIAssistantService.sendMessage(message, conversationHistory);

    // Add AI response
    messages.value.push({
      role: 'assistant',
      content: response.response,
      action: response.action || null,
      actionError: response.actionError || null,
      timestamp: new Date().toISOString(),
    });

    // Scroll to bottom after response
    await scrollToBottom();
  } catch (err) {
    error.value = err.message || 'Failed to get AI response. Please try again.';
    console.error('AI Assistant Error:', err);
  } finally {
    isLoading.value = false;
    // Focus input after response
    await nextTick();
    if (inputRef.value) {
      inputRef.value.focus();
    }
  }
};

const runAction = async (action, idx) => {
  if (!action || isLoading.value) return;
  const actionToRun = pendingFollowups.value[idx] || action;
  const form = actionStatuses.value[idx]?.form;
  if (form && typeof form === 'object') {
    if (form.name != null && String(form.name).trim() !== '') actionToRun.params = { ...actionToRun.params, name: String(form.name).trim() };
    if (form.category != null) actionToRun.params = { ...actionToRun.params, category: form.category };
    if (form.quantity != null && form.quantity !== '') actionToRun.params = { ...actionToRun.params, quantity: Number(form.quantity) };
    if (form.volume != null && form.volume !== '') actionToRun.params = { ...actionToRun.params, plannedVolume: Number(form.volume) };
    if (form.packagedVolume != null && form.packagedVolume !== '') actionToRun.params = { ...actionToRun.params, packagedVolume: Number(form.packagedVolume) };
  }
  actionStatuses.value = {
    ...actionStatuses.value,
    [idx]: { state: 'running' }
  };
  try {
    delete pendingFollowups.value[idx];
    const result = await AssistantActionExecutor.execute(actionToRun);
    actionStatuses.value = {
      ...actionStatuses.value,
      [idx]: { state: result.status, message: result.message }
    };
    messages.value.push({
      role: 'assistant',
      content: result.message,
      timestamp: new Date().toISOString(),
    });
    if (result.status === 'need_location') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_location',
          message: result.message,
          options: result.options || [],
          fromOptions: result.fromOptions || [],
          toOptions: result.toOptions || [],
          action,
        }
      };
      pendingFollowups.value = {
        ...pendingFollowups.value,
        [idx]: action
      };
      return;
    }
    if (result.status === 'need_recipe') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_recipe',
          message: result.message,
          recipes: result.recipes || [],
          action,
        }
      };
      pendingFollowups.value = {
        ...pendingFollowups.value,
        [idx]: action
      };
      return;
    }
    if (result.status === 'need_vessel') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_vessel',
          message: result.message,
          vessels: result.vessels || [],
          action,
        }
      };
      pendingFollowups.value = {
        ...pendingFollowups.value,
        [idx]: action
      };
      return;
    }
    if (result.status === 'need_batch') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_batch',
          message: result.message,
          batches: result.batches || [],
          action,
        }
      };
      pendingFollowups.value = {
        ...pendingFollowups.value,
        [idx]: action
      };
      return;
    }
    if (result.status === 'need_item') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_item',
          message: result.message,
          items: result.items || [],
          action,
        }
      };
      pendingFollowups.value = {
        ...pendingFollowups.value,
        [idx]: action
      };
      return;
    }
    if (result.status === 'need_quantity' || result.status === 'need_volume') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: result.status,
          message: result.message,
          action,
          form: { quantity: '', volume: '' }
        }
      };
      pendingFollowups.value = { ...pendingFollowups.value, [idx]: action };
      return;
    }
    if (result.status === 'need_item_name') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_item_name',
          message: result.message,
          items: result.items || [],
          action,
          form: { name: '', category: 'Other' }
        }
      };
      pendingFollowups.value = { ...pendingFollowups.value, [idx]: action };
      return;
    }
    if (result.status === 'need_location_name') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_location_name',
          message: result.message,
          action,
          form: { name: '' }
        }
      };
      pendingFollowups.value = { ...pendingFollowups.value, [idx]: action };
      return;
    }
    if (result.status === 'need_packaging_volume') {
      actionStatuses.value = {
        ...actionStatuses.value,
        [idx]: {
          state: 'need_packaging_volume',
          message: result.message,
          action,
          form: { packagedVolume: '' }
        }
      };
      pendingFollowups.value = { ...pendingFollowups.value, [idx]: action };
      return;
    }
    actionHistory.value = [
      { action: actionToRun, result, timestamp: new Date().toISOString() },
      ...actionHistory.value
    ].slice(0, 20);
    await scrollToBottom();
  } catch (err) {
    actionStatuses.value = {
      ...actionStatuses.value,
      [idx]: { state: 'error', message: err.message || 'Action failed.' }
    };
  }
};

const applyLocationAndRetry = async (idx, mode, option) => {
  const base = pendingFollowups.value[idx];
  if (!base) return;
  const updated = JSON.parse(JSON.stringify(base));
  if (mode === 'single') {
    updated.params.locationId = option.id;
    updated.params.locationName = option.name;
  } else if (mode === 'from') {
    updated.params.fromLocationId = option.id;
    updated.params.fromLocationName = option.name;
  } else if (mode === 'to') {
    updated.params.toLocationId = option.id;
    updated.params.toLocationName = option.name;
  }
  pendingFollowups.value = { ...pendingFollowups.value, [idx]: updated };
  actionStatuses.value = { ...actionStatuses.value, [idx]: { state: 'ready', message: `Ready to run with ${option.name}` } };
};

const applyRecipeOrVessel = async (idx, mode, option) => {
  const base = pendingFollowups.value[idx];
  if (!base) return;
  const updated = JSON.parse(JSON.stringify(base));
  if (mode === 'recipe') {
    updated.params.recipeId = option.id;
    updated.params.recipeName = option.name;
  } else if (mode === 'vessel') {
    updated.params.vesselId = option.id;
    updated.params.vesselName = option.name;
  }
  pendingFollowups.value = { ...pendingFollowups.value, [idx]: updated };
  actionStatuses.value = { ...actionStatuses.value, [idx]: { state: 'ready', message: `Ready to run with ${option.name}` } };
};

const applyOptionAndPrepare = (idx, field, option) => {
  const base = pendingFollowups.value[idx];
  if (!base) return;
  const updated = JSON.parse(JSON.stringify(base));
  if (field === 'batch') {
    updated.params.batchId = option.id;
    updated.params.batchName = option.name;
  } else if (field === 'item') {
    updated.params.itemId = option.id;
    updated.params.itemName = option.name;
  } else if (field === 'source') {
    updated.params.sourceBatchLocationId = option.id;
    updated.params.sourceBatchLocationName = option.name;
  } else if (field === 'dest') {
    if (!updated.params.destinations) updated.params.destinations = [];
    updated.params.destinations = [{ batchLocationId: option.id, volume: option.volume || null }];
  } else if (field === 'location') {
    updated.params.locationId = option.id;
    updated.params.locationName = option.name;
  }
  pendingFollowups.value = { ...pendingFollowups.value, [idx]: updated };
  actionStatuses.value = { ...actionStatuses.value, [idx]: { state: 'ready', message: `Ready to run with ${option.name}` } };
};

onMounted(() => {
  // Focus input on mount
  if (inputRef.value) {
    inputRef.value.focus();
  }
});
</script>

<style scoped>
.ai-assistant-container {
  min-height: 100%;
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.dark .messages-container::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>
