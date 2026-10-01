<script setup lang="ts">
import { calendarDate, selectSessionsForPlan } from '@bunpro-nakama/session-history';

interface PlanWindow {
  lookbackDays: number;
  maxSessions: number;
}

interface ListedSession {
  id: string;
  startedAt: string;
  sessionDate?: string | null;
  attemptCount: number;
  incorrectCount: number;
}

const { data: sessions } = await useFetch<ListedSession[]>('/api/sessions', { key: 'sessions' });
const { data: plans, refresh } = await useFetch('/api/lesson-plans', { key: 'lesson-plans' });
const { data: status } = await useFetch('/api/status');
const { data: settings } = await useFetch<PlanWindow>('/api/settings');

const selected = ref<string[]>([]);
const pending = ref(false);
const promptPending = ref(false);
const promptOpen = ref(false);
const promptText = ref('');
const sessionsOpen = ref(false);
const errorMessage = ref('');
const appliedWindow = ref(false);
const deleteOpen = ref(false);
const deleteId = ref('');
const deleteLabel = ref('');
const deletePending = ref(false);

const eligible = computed(() => {
  if (!sessions.value || !settings.value) return [];
  return selectSessionsForPlan(sessions.value, settings.value, calendarDate(new Date()));
});

watch(
  eligible,
  (rows) => {
    if (appliedWindow.value) return;
    selected.value = rows.map((session) => session.id);
    if (settings.value) appliedWindow.value = true;
  },
  { immediate: true },
);

function toggle(id: string, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter((item) => item !== id);
}

function messageFrom(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string } }).data;
    if (data?.statusMessage) return data.statusMessage;
  }
  return error instanceof Error ? error.message : fallback;
}

async function showPrompt() {
  promptPending.value = true;
  errorMessage.value = '';
  try {
    const result = await $fetch<{ prompt: string }>('/api/lesson-plans/prompt', {
      method: 'POST',
      body: { sessionIds: selected.value },
    });
    promptText.value = result.prompt;
    promptOpen.value = true;
  } catch (error) {
    errorMessage.value = messageFrom(error, 'Could not build the prompt');
  } finally {
    promptPending.value = false;
  }
}

function askDelete(id: string, title: string) {
  deleteId.value = id;
  deleteLabel.value = title;
  errorMessage.value = '';
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deletePending.value = true;
  errorMessage.value = '';
  try {
    await $fetch(`/api/lesson-plans/${encodeURIComponent(deleteId.value)}`, { method: 'DELETE' });
    deleteOpen.value = false;
    await refresh();
  } catch (error) {
    errorMessage.value = messageFrom(error, 'Could not delete the lesson plan');
  } finally {
    deletePending.value = false;
  }
}

async function generate() {
  pending.value = true;
  errorMessage.value = '';
  try {
    const created = await $fetch<{ id: string }>('/api/lesson-plans', {
      method: 'POST',
      body: { sessionIds: selected.value },
    });
    await refresh();
    await navigateTo(`/plans/${created.id}`);
  } catch (error) {
    errorMessage.value = messageFrom(error, 'Could not generate a lesson plan');
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Lesson plans</h1>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="sessionsOpen = true">
          Sessions
        </UButton>
        <UButton :loading="pending" :disabled="selected.length === 0" @click="generate">
          Generate lesson plan
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          :loading="promptPending"
          :disabled="selected.length === 0"
          @click="showPrompt"
        >
          Generate Prompt
        </UButton>
      </div>
    </div>

    <p class="text-muted">
      Gemini reads only the incorrect answers in this window and looks for patterns with at
      least three misses: word stems, help prompts, lessons, words, word types, and grammar
      points. The key stays in <code>GEMINI_API_KEY</code>.
    </p>

    <UAlert
      v-if="status && !status.geminiConfigured"
      color="warning"
      title="Add GEMINI_API_KEY to apps/web/.env"
      :description="`Configured model: ${status.geminiModel}`"
    />
    <UAlert v-if="errorMessage" color="error" :title="errorMessage" />

    <section class="rounded-lg border">
      <p v-if="!plans?.length" class="p-4 text-muted">No lesson plans yet.</p>
      <ul v-else class="divide-y">
        <li v-for="plan in plans" :key="plan.id" class="flex items-center">
          <NuxtLink
            :to="`/plans/${plan.id}`"
            class="block min-w-0 flex-1 p-4 hover:bg-elevated"
          >
            <span class="font-medium">{{ plan.title }}</span>
            <span class="mt-1 block text-sm text-muted">{{ plan.createdAt }} · {{ plan.model }}</span>
          </NuxtLink>
          <UButton
            class="mr-2 shrink-0"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            aria-label="Delete lesson plan"
            @click="askDelete(plan.id, plan.title)"
          />
        </li>
      </ul>
    </section>

    <USlideover v-model:open="sessionsOpen" title="Sessions" side="right">
      <template #body>
        <p v-if="settings" class="text-sm text-muted">
          Using the newest {{ settings.maxSessions }} sessions from the last {{ settings.lookbackDays }} days.
          <NuxtLink to="/settings" class="underline">Change this in Settings</NuxtLink>.
        </p>
        <div class="mt-4 max-h-[calc(100dvh-12rem)] space-y-3 overflow-y-auto">
          <p v-if="!sessions?.length" class="text-muted">Import a session before generating a plan.</p>
          <p v-else-if="eligible.length === 0" class="text-muted">
            No imported sessions fall in this window.
          </p>
          <label v-for="session in eligible" :key="session.id" class="flex items-start gap-2">
            <input
              type="checkbox"
              :value="session.id"
              :checked="selected.includes(session.id)"
              @change="toggle(session.id, ($event.target as HTMLInputElement).checked)"
            >
            <span>
              {{ session.sessionDate || session.startedAt.slice(0, 10) }}
              · {{ session.id }}
              <span class="text-muted">
                · {{ session.incorrectCount }} incorrect / {{ session.attemptCount }} answers
              </span>
            </span>
          </label>
        </div>
      </template>
    </USlideover>

    <PromptPreviewModal v-model:open="promptOpen" :prompt="promptText" />
    <ConfirmDeleteModal
      v-model:open="deleteOpen"
      heading="Delete lesson plan"
      :message="`Delete ${deleteLabel}? This cannot be undone.`"
      :pending="deletePending"
      @confirm="confirmDelete"
    />
  </div>
</template>
