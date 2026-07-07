<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
import type { Provider, ScheduleItem } from "../../server/core/types";

const { config, send } = useBoard();

// SelectItem list for USelect — label is the display name, value is the index
// into config.providers, which is stable for the lifetime of the session.
const providerItems = computed<SelectItem[]>(
    () =>
        config.value?.providers.map((p, i) => ({
            label: `${p.first} ${p.last}`,
            value: i,
        })) ?? [],
);

const selectedProviderIndex = ref<number | null>(null);

const selectedProvider = computed<Provider | null>(() =>
    selectedProviderIndex.value !== null
        ? (config.value?.providers[selectedProviderIndex.value] ?? null)
        : null,
);

// SelectItem list for USelect — label is the schedule name, value is the index
// into config.schedule, which is stable for the lifetime of the session.
const scheduleItems = computed<SelectItem[]>(
    () =>
        config.value?.schedule.map((s, i) => ({
            label: s.name,
            value: i,
        })) ?? [],
);

const selectedScheduleIndex = ref<number | null>(null);

const selectedSchedule = computed<ScheduleItem | null>(() =>
    selectedScheduleIndex.value !== null
        ? (config.value?.schedule[selectedScheduleIndex.value] ?? null)
        : null,
);

const isDisabled = computed<boolean>(
    () => selectedProvider.value === null || selectedSchedule.value === null,
);

const popoverOpen = ref(false);
const loading = ref(false);

function clearSelections() {
    selectedProviderIndex.value = null;
    selectedScheduleIndex.value = null;
}

async function signIn() {
    if (!selectedProvider.value || !selectedSchedule.value) return;
    loading.value = true;
    await send({
        action: "signIn",
        payload: {
            provider: selectedProvider.value,
            schedule: selectedSchedule.value,
        },
    });
    loading.value = false;
    popoverOpen.value = false;
}
</script>

<template>
    <UPopover
        v-model:open="popoverOpen"
        @update:open="(open) => !open && clearSelections()"
    >
        <UButton
            color="neutral"
            size="lg"
            leading-icon="lucide:stethoscope"
            trailing-icon="octicon:triangle-down-16"
            label="Add"
        />

        <template #content>
            <div class="p-3 flex flex-col gap-2 w-60">
                <USelect
                    v-model="selectedProviderIndex"
                    :items="providerItems"
                    size="lg"
                    color="neutral"
                    variant="outline"
                    placeholder="Select clinician"
                />
                <USelect
                    v-model="selectedScheduleIndex"
                    :items="scheduleItems"
                    size="lg"
                    color="neutral"
                    variant="outline"
                    placeholder="Select shift"
                />
                <UButton
                    size="lg"
                    color="neutral"
                    class="justify-center"
                    label="Add to Board"
                    :disabled="isDisabled"
                    :loading="loading"
                    @click="signIn"
                />
            </div>
        </template>
    </UPopover>
</template>
