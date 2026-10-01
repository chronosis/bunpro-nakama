<script setup lang="ts">
const route = useRoute();
const id = computed(() => String(route.params.id));
const { data } = await useFetch(() => `/api/lesson-plans/${encodeURIComponent(id.value)}`);

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
    await $fetch(`/api/lesson-plans/${encodeURIComponent(id.value)}`, { method: 'DELETE' });
    deleteOpen.value = false;
    clearNuxtData('lesson-plans');
    await navigateTo('/plans');
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
  return error instanceof Error ? error.message : 'Could not delete the lesson plan';
}
</script>

<template>
  <div v-if="data" class="space-y-6">
    <NuxtLink to="/plans" class="text-sm underline">All lesson plans</NuxtLink>
    <div class="flex items-center justify-between gap-3">
      <h1 class="min-w-0 text-2xl font-semibold">{{ data.plan.title }}</h1>
      <UButton class="shrink-0" color="error" variant="soft" @click="askDelete">
        Delete
      </UButton>
    </div>
    <UAlert v-if="errorMessage" color="error" :title="errorMessage" />
    <p class="text-sm text-muted">{{ data.createdAt }} · {{ data.model }}</p>
    <p v-if="data.plan.summary">{{ data.plan.summary }}</p>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Patterns</h2>
      <UCard v-for="pattern in data.plan.patterns" :key="pattern.title">
        <h3 class="font-medium">{{ pattern.title }}</h3>
        <ul v-if="pattern.missedQuestions.length" class="mt-2 list-disc space-y-1 pl-5">
          <li v-for="(question, index) in pattern.missedQuestions" :key="index">{{ question }}</li>
        </ul>
        <p class="mt-2">{{ pattern.evidence }}</p>
        <p class="mt-2 text-muted">{{ pattern.suggestion }}</p>
      </UCard>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Practice next</h2>
      <UCard v-for="item in data.plan.focusItems" :key="item.label">
        <h3 class="font-medium">{{ item.label }}</h3>
        <p class="mt-2">{{ item.why }}</p>
        <p class="mt-2 text-muted">{{ item.practice }}</p>
      </UCard>
    </section>

    <ConfirmDeleteModal
      v-model:open="deleteOpen"
      heading="Delete lesson plan"
      :message="`Delete ${data.plan.title}? This cannot be undone.`"
      :pending="deletePending"
      @confirm="confirmDelete"
    />
  </div>
</template>
