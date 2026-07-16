<script setup lang="ts">
import type { Zone } from "../../server/core/types";
import { getShiftFlags } from "../utils/shiftFlags";

const { board, send } = useBoard();

const props = defineProps<{
    zoneSlug: string;
}>();

const open = ref(true);
const loading = ref(false);

const collapseIcon = computed(() => {
    return open.value ? "lucide:chevrons-down-up" : "lucide:chevrons-up-down";
});

const zone = computed<Zone | undefined>(
    () => board.value?.zones[props.zoneSlug],
);

// shift flags depend on shift and zone
// so they belong to zone, pass to shift
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
    <UCollapsible
        v-if="zone"
        v-model:open="open"
        class="mb-2 md:mb-9"
        :class="zone.slug === 'off' && 'hidden md:inline'"
    >
        <!-- HEADER -->
        <SectionHeader :title="zone.name">
            <UBadge
                :icon="collapseIcon"
                color="neutral"
                :variant="open ? 'soft' : 'solid'"
            />
        </SectionHeader>

        <!-- COLLAPSIBLE -->
        <template #content>
            <!-- SHIFTS -->
            <template v-if="zone.shifts.length === 0">
                <UEmpty description="No shifts on rotation yet." />
            </template>

            <template v-for="shiftId in zone.shifts">
                <Shift
                    :shiftId="shiftId"
                    :flags="flags(shiftId)"
                    :zoneSlug="zone.slug"
                />
            </template>

            <!-- ROTATION CONTROLS -->
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
                    :trailing="true"
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
                    :trailing="true"
                    @click="adjustRotation({ which: 'super', offset: 1 })"
                    label="Supervisor"
                />
            </div>
        </template>
    </UCollapsible>
</template>
