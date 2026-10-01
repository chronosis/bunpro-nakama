<script setup lang="ts">
const { data: sessions, refresh } = await useFetch('/api/sessions', { key: 'sessions' });

const fileInput = ref<HTMLInputElement | null>(null);
const pending = ref(false);
const dragging = ref(0);
const message = ref('');
const errorMessage = ref('');
const deleteOpen = ref(false);
const deleteId = ref('');
const deletePending = ref(false);

const showDropOverlay = computed(() => dragging.value > 0 || pending.value);

function openPicker() {
  fileInput.value?.click();
}

function dragEnter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) return;
  dragging.value += 1;
}

function dragLeave() {
  dragging.value = Math.max(0, dragging.value - 1);
}

async function onFile(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
  await importFile(input.files[0]);
  input.value = '';
}

async function onDrop(event: DragEvent) {
  dragging.value = 0;
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  await importFile(file);
}

function askDelete(id: string) {
  deleteId.value = id;
  errorMessage.value = '';
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deletePending.value = true;
  errorMessage.value = '';
  try {
    await $fetch(`/api/sessions/${encodeURIComponent(deleteId.value)}`, { method: 'DELETE' });
    deleteOpen.value = false;
    await refresh();
  } catch (error) {
    errorMessage.value = messageFrom(error);
  } finally {
    deletePending.value = false;
  }
}

function messageFrom(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'statusMessage' in data && typeof data.statusMessage === 'string') {
      return data.statusMessage;
    }
  }
  return error instanceof Error ? error.message : 'Could not delete the session';
}

async function importFile(file: File) {
  pending.value = true;
  message.value = '';
  errorMessage.value = '';
  try {
    const payload: unknown = JSON.parse(await file.text());
    if (payload === null || typeof payload !== 'object') {
      throw new Error('Export must be a JSON object');
    }
    const result = await $fetch<{
      importedSessions: number;
      skippedSessions: number;
      importedAttempts: number;
    }>('/api/imports', {
      method: 'POST',
      body: payload,
    });
    message.value = `Imported ${result.importedSessions} sessions (${result.importedAttempts} answers). Skipped ${result.skippedSessions} already stored.`;
    await refresh();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Import failed';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Sessions</h1>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="soft" :loading="pending" @click="openPicker">
          Import
        </UButton>
        <UButton color="neutral" variant="soft" @click="refresh()">Refresh</UButton>
        <input
          ref="fileInput"
          class="hidden"
          type="file"
          accept="application/json,.json"
          :disabled="pending"
          @change="onFile"
        >
      </div>
    </div>

    <p class="text-sm text-muted">
      Export JSON from the extension, then use Import or drop the file on the list. Importing the
      same file again does not duplicate sessions.
    </p>

    <UAlert v-if="message" color="success" :title="message" />
    <UAlert v-if="errorMessage" color="error" :title="errorMessage" />

    <section
      class="relative min-h-32 rounded-lg border"
      @dragenter.prevent="dragEnter"
      @dragover.prevent
      @dragleave="dragLeave"
      @drop.prevent="onDrop"
    >
      <p v-if="!sessions?.length" class="p-4 text-muted">No sessions imported yet.</p>
      <ul v-else class="divide-y">
        <li v-for="session in sessions" :key="session.id" class="flex items-center">
          <NuxtLink
            :to="`/sessions/${encodeURIComponent(session.id)}`"
            class="block min-w-0 flex-1 p-4 hover:bg-elevated"
          >
            <span class="font-medium break-all">{{ session.id }}</span>
            <span class="mt-1 block text-sm text-muted">
              {{ session.sessionDate || session.startedAt }}
              · {{ session.attemptCount }} answers ·
              {{ session.correctCount }} correct · {{ session.incorrectCount }} incorrect
            </span>
          </NuxtLink>
          <UButton
            class="mr-2 shrink-0"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            aria-label="Delete session"
            @click="askDelete(session.id)"
          />
        </li>
      </ul>
      <div
        v-if="showDropOverlay"
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-sm font-medium text-white"
      >
        {{ pending && dragging === 0 ? 'Importing…' : 'Drop to import' }}
      </div>
    </section>

    <p>
      <a class="underline" href="/sample-history.json" download>Download a sample export</a>
    </p>

    <ConfirmDeleteModal
      v-model:open="deleteOpen"
      :session-id="deleteId"
      :pending="deletePending"
      @confirm="confirmDelete"
    />
  </div>
</template>
