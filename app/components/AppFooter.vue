<script setup lang="ts">
const { board, config } = useBoard();
const formattedDate = computed(() => {
    if (!board.value?.date) return "";
    const date = new Date(Number(board.value.date));
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    }).format(date);
});
</script>
<template>
    <UFooter>
        <template #right>
            <UPopover>
                <UButton
                    color="neutral"
                    variant="soft"
                    icon="fa7-solid:tools"
                />
                <template #content>
                    <div class="flex flex-col gap-2 p-3 text-sm">
                        <div><b>Development Tools</b></div>
                        <USeparator />
                        <div>
                            <b>Board Date:</b>
                            {{ formattedDate }}
                        </div>

                        <USlideover side="right" inset title="Config JSON">
                            <UButton
                                color="neutral"
                                variant="outline"
                                label="Config JSON"
                            />
                            <template #body>
                                <pre>{{ config }}</pre>
                            </template>
                        </USlideover>

                        <USlideover side="right" inset title="Board JSON">
                            <UButton
                                color="neutral"
                                variant="outline"
                                label="Board JSON"
                            />
                            <template #body>
                                <pre>{{ board }}</pre>
                            </template>
                        </USlideover>

                        <UButton
                            color="neutral"
                            variant="outline"
                            to="/admin"
                            label="Edit Config"
                        />
                    </div>
                </template>
            </UPopover>
        </template>
    </UFooter>
</template>
