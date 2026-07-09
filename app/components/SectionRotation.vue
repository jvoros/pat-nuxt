<script setup lang="ts">
import type { Zone } from "../../server/core/types";

const { board, send } = useBoard();

const props = defineProps<{
    zoneSlug: string;
}>();

const open = ref(true);
const loading = ref(false);

const zone = computed<Zone | undefined>(
    () => board.value?.zones[props.zoneSlug],
);

const flags = (shiftId: string) => {
    const z = zone.value;
    const s = board.value?.shifts[shiftId];
    if (!z || !s) return null;
    return getShiftFlags(shiftId, z, s);
};

const isRotation = computed<boolean>(() =>
    ["rotation", "dual"].includes(zone.value.type),
);
const isSuperRot = computed<boolean>(() =>
    ["dual", "super"].includes(zone.value.type),
);

async function adjustRotation(params: { which: string; offset: number }) {
    loading.value = params.which + params.offset;
    await send({
        action: "adjustRotation",
        payload: {
            zoneSlug: zone.value.slug,
            which: params.which,
            offset: params.offset,
        },
    });
    loading.value = false;
}
</script>

<template>
    <UCollapsible v-if="zone" v-model:open="open" class="mb-2 md:mb-9">
        <SectionHeader :title="zone.name" icon="lucide:chevrons-up-down" />
        <template #content>
            <template v-for="shiftId in zone.shifts">
                <Shift :shift-id="shiftId" :flags="flags(shiftId)" />
            </template>
            <div v-if="isRotation" class="flex justify-between my-2">
                <UButton
                    color="neutral"
                    variant="outline"
                    leadingIcon="fa7-solid:angle-left"
                    :loading="loading === 'next-1'"
                    @click="adjustRotation({ which: 'next', offset: -1 })"
                    label="Rotation"
                />
                <UButton
                    color="neutral"
                    variant="outline"
                    trailingIcon="fa7-solid:angle-right"
                    :loading="loading === 'next1'"
                    @click="adjustRotation({ which: 'next', offset: 1 })"
                    label="Rotation"
                />
            </div>
            <div v-if="isSuperRot" class="flex justify-between">
                <UButton
                    color="neutral"
                    variant="outline"
                    leadingIcon="fa7-solid:angle-left"
                    :loading="loading === 'super-1'"
                    @click="adjustRotation({ which: 'super', offset: -1 })"
                    label="Supervisor"
                />
                <UButton
                    color="neutral"
                    variant="outline"
                    trailingIcon="fa7-solid:angle-right"
                    :loading="loading === 'super1'"
                    @click="adjustRotation({ which: 'super', offset: 1 })"
                    label="Supervisor"
                />
            </div>
        </template>
    </UCollapsible>
</template>
