<script setup lang="ts">
const { loggedIn, login } = useAuth();

if (loggedIn.value) {
    await navigateTo("/board");
}

const slug = ref("smh");
const code = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
    error.value = "";
    loading.value = true;
    try {
        await login(slug.value, code.value);
    } catch {
        error.value = "Invalid site or access code.";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div
        class="mx-auto mt-30 w-100 flex flex-col gap-4 py-8 px-8 border rounded border-muted bg-white"
    >
        <img src="/pat.svg" class="w-24" />
        <div class="font-bold text-4xl w-60">Welcome to the Rotation.</div>
        <form @submit.prevent="submit" class="flex flex-col gap-4">
            <UFormField label="Access Code">
                <UInput
                    v-model="code"
                    type="password"
                    class="w-full"
                    color="neutral"
                    required
                />
            </UFormField>

            <UAlert
                color="error"
                variant="outline"
                v-if="error"
                :description="error"
            />
            <UButton
                type="submit"
                :disabled="loading"
                :loading="loading"
                color="neutral"
                size="xl"
                label="Log On"
                class="justify-center"
            />
        </form>
    </div>
</template>
