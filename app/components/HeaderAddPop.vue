<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
import type { Provider, ScheduleItem } from "../../server/core/types";

const { config, send } = useBoard();

// PROVIDER
// use add index to items
const providerItems = computed<SelectItem[]>(
    () =>
        config.value?.providers.map((p, i) => ({
            label: `${p.first} ${p.last}`,
            value: i,
        })) ?? [],
);
// model value based on index
const selectedProviderIndex = ref<number | null>(null);
// use index to get provider
const selectedProvider = computed<Provider | null>(() =>
    selectedProviderIndex.value !== null
        ? (config.value?.providers[selectedProviderIndex.value] ?? null)
        : null,
);

// SCHEDULE
// add index
const scheduleItems = computed<SelectItem[]>(
    () =>
        config.value?.schedule.map((s, i) => ({
            label: s.name,
            value: i,
        })) ?? [],
);
// model index in select box
const selectedScheduleIndex = ref<number | null>(null);
// use index to get schedule
const selectedSchedule = computed<ScheduleItem | null>(() =>
    selectedScheduleIndex.value !== null
        ? (config.value?.schedule[selectedScheduleIndex.value] ?? null)
        : null,
);

// FORM STATE
const popoverOpen = ref(false);
const loading = ref(false);
const isDisabled = computed<boolean>(
    () => selectedProvider.value === null || selectedSchedule.value === null,
);

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
    clearSelections();
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
            leading-icon="fa7-solid:stethoscope"
            trailing-icon="fa7-solid:caret-down"
            label="Sign In"
        />

        <template #content>
            <div class="w-60">
                <div class="p-2 font-bold text-sm">Sign In to Board</div>
                <USeparator />
                <div class="p-3 flex flex-col gap-2">
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
                    <div v-if="selectedSchedule?.reset === true">
                        <UAlert
                            color="warning"
                            variant="subtle"
                            icon="fa7-solid:warning"
                            description="Adding this shift will reset the board."
                        />
                    </div>
                </div>
            </div>
        </template>
    </UPopover>
</template>
