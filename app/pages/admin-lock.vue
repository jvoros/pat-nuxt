<script setup lang="ts">
const { adminLogin } = useAuth();
const { board, config } = useBoard();

const code = ref("");
const error = ref("");

const loading = ref(false);

async function submit() {
    error.value = "";
    loading.value = true;
    try {
        await adminLogin(code.value);
    } catch {
        error.value = "Invalid site or access code.";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <AppHeader />
    <UMain>
        <UContainer>
            <div class="flex justify-around">
                <form @submit.prevent="submit" class="flex flex-col gap-2">
                    <UInput
                        v-model="code"
                        type="text"
                        color="neutral"
                        placeholder="Code"
                        autocomplete="off"
                        required
                    />
                    <UAlert v-if="error" color="error" :description="error" />
                    <UButton color="neutral" type="submit" :disabled="loading">
                        {{ loading ? "Checking…" : "Check Code" }}
                    </UButton>
                </form>
            </div>
        </UContainer>
    </UMain>
    <AppFooter />
</template>
