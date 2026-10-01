<script setup lang="ts">
const { data: status } = await useFetch('/api/status');
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-semibold">Review history, then a lesson plan</h1>
      <p class="mt-2 text-muted">
        The browser extension records Bunpro answers locally. Import that export here to keep it,
        then ask Gemini where the misses cluster.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">Sessions</p>
        <p class="text-2xl font-semibold">{{ status?.sessionCount ?? 0 }}</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Answers</p>
        <p class="text-2xl font-semibold">{{ status?.attemptCount ?? 0 }}</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Lesson plans</p>
        <p class="text-2xl font-semibold">{{ status?.planCount ?? 0 }}</p>
      </UCard>
    </div>

    <UAlert
      v-if="status && !status.geminiConfigured"
      color="warning"
      title="Gemini is not configured"
      description="Copy apps/web/sample.env to apps/web/.env and set GEMINI_API_KEY before generating a lesson plan."
    />

    <div class="flex gap-2">
      <UButton to="/sessions">Import a session</UButton>
      <UButton to="/plans" color="neutral" variant="soft">Open lesson plans</UButton>
      <UButton to="/verbs" color="neutral" variant="soft">Verb study</UButton>
    </div>
  </div>
</template>
