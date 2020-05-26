<script>
  import { onMount } from "svelte";
  import ListItem from "./ListItem.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  onMount(async () => {
    dispatch("listCreated", {});
  });

  export let list;
  export let index;
</script>

<ul class="list-group" id="items">
  {#each list as item}
    <ListItem {...item} {index} />
  {/each}
</ul>
