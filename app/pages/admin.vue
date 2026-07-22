<script setup lang="ts">
import JsonEditorVue from "json-editor-vue";
import LiteJsonEditor from "lite-json-editor";
const { board, config, updateConfig } = useBoard();
// extra auth
definePageMeta({
    middleware: "admin",
});

const error = ref(false);
const loading = ref(false);
const content = ref({ json: "" });
// get a copy of the config at put in content.json
watch(
    config,
    (newConfig) => {
        // Only clone once config actually has data loaded
        if (newConfig && !content.value !== null) {
            content.value.json = structuredClone(toRaw(newConfig));
        }
    },
    // immediate runs on initial mount; deep watches nested updates
    { immediate: true, deep: true },
);

const hasUnsavedChanges = computed(() => {
    if (!content.value.json || !config.value) return false;
    return JSON.stringify(content.value?.json) !== JSON.stringify(config.value);
});

function handleChange(
    updatedContent,
    previousContent,
    { contentErrors, patchResult },
) {
    if (contentErrors) error.value = true;
    if (!contentErrors) {
        error.value = false;
        content.value.json = JSON.parse(updatedContent.text);
    }
    // content is an object { json: unknown } | { text: string }
    // console.log("onChange: ", {
    //     updatedContent,
    //     previousContent,
    //     contentErrors,
    //     patchResult,
    // });
}

async function handleSave() {
    loading.value = true;
    await updateConfig(config.value.slug, content.value.json);
    loading.value = false;
}
</script>

<template>
    <AppHeader />
    <UMain class="flex flex-col">
        <div class="border border-muted mx-auto h-[80vh] overflow-y-auto">
            <div class="sticky top-0 z-10 bg-muted p-3 border-b border-muted">
                <div class="font-bold text-lg">Edit Configuration</div>

                <div class="font-bold text-sm">Site: {{ config?.name }}</div>
                <div class="flex gap-2 items-center">
                    <UButton
                        :disabled="error"
                        :loading="loading"
                        @click="handleSave"
                        label="Update Config"
                        color="neutral"
                        icon="fa7-solid:save"
                        class="my-2"
                    />
                    <UBadge v-if="error" color="error" label="Invalid JSON" />
                    <UBadge
                        v-if="hasUnsavedChanges"
                        color="warning"
                        variant="solid"
                        label="Unsaved Changes"
                    />
                </div>
            </div>

            <JsonEditorVue
                :content="content"
                :onChange="handleChange"
                class="w-200 relative"
                mode="text"
                :mainMenuBar="false"
            />
        </div>
    </UMain>
    <AppFooter />
</template>
