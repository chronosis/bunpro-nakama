<script setup lang="ts">
const route = useRoute();
const id = computed(() => String(route.params.id));
const { data } = await useFetch(() => `/api/sessions/${encodeURIComponent(id.value)}`);

const deleteOpen = ref(false);
const deletePending = ref(false);
const errorMessage = ref('');

function askDelete() {
  errorMessage.value = '';
  deleteOpen.value = true;
}

async function confirmDelete() {
  deletePending.value = true;
  errorMessage.value = '';
  try {
    await $fetch(`/api/sessions/${encodeURIComponent(id.value)}`, { method: 'DELETE' });
    deleteOpen.value = false;
    clearNuxtData('sessions');
    await navigateTo('/sessions');
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
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/sessions" class="text-sm underline">All sessions</NuxtLink>
    <div class="flex items-center justify-between gap-3">
      <h1 class="min-w-0 text-2xl font-semibold break-all">{{ data?.session.id }}</h1>
      <UButton v-if="data?.session" class="shrink-0" color="error" variant="soft" @click="askDelete">
        Delete
      </UButton>
    </div>
    <UAlert v-if="errorMessage" color="error" :title="errorMessage" />
    <p class="text-sm text-muted">
      {{ data?.session.sessionDate || data?.session.startedAt }}
      <span v-if="data?.session.sessionDate"> · started {{ data.session.startedAt }}</span>
    </p>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b">
            <th class="py-2 pr-3">Result</th>
            <th class="py-2 pr-3">Item</th>
            <th class="py-2 pr-3">Answer</th>
            <th class="py-2">Accepted</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attempt in data?.attempts ?? []" :key="attempt.id" class="border-b align-top">
            <td class="py-2 pr-3">{{ attempt.result }}</td>
            <td class="py-2 pr-3">
              <div>{{ attempt.grammarPoint || 'Untitled' }}</div>
              <div class="text-muted">{{ attempt.prompt }}</div>
              <div v-if="attempt.helpPrompt" class="text-muted">Help: {{ attempt.helpPrompt }}</div>
              <div v-if="attempt.lessonLabel" class="text-muted">{{ attempt.lessonLabel }}</div>
              <div v-if="attempt.word || attempt.wordType" class="text-muted">
                {{ [attempt.word, attempt.wordType, attempt.partOfSpeech].filter(Boolean).join(' · ') }}
              </div>
            </td>
            <td class="py-2 pr-3">{{ attempt.userAnswer }}</td>
            <td class="py-2">{{ attempt.acceptedAnswers.join(', ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDeleteModal
      v-if="data?.session"
      v-model:open="deleteOpen"
      :session-id="data.session.id"
      :pending="deletePending"
      @confirm="confirmDelete"
    />
  </div>
</template>
