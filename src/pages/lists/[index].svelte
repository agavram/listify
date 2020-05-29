<script>
  import { flip } from "svelte/animate";
  import { collectionData } from "rxfire/firestore";
  import { db } from "../../firebase";
  import ListItem from "../../_components/ListItem.svelte";
  import Spinner from "../../_components/Spinner.svelte";
  import { dndzone } from "../../_components/dnd-swap/action.js";
  import { quintOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";

  export let index;

  const ref = db
    .collection("lists")
    .doc(index)
    .collection("list")
    .orderBy("generated");

  const flipDurationMs = 300;

  let list;
  let input = "";

  ref
    .limit(1)
    .get()
    .then(query => {
      if (query.size >= 1) {
        collectionData(ref, "id").subscribe(res => {
          res.shift();
          list = res;
        });
      } else {
        list = "error";
      }
    });

  async function append(e) {
    if (input == "") {
      return;
    }

    db.collection("lists")
      .doc(index)
      .collection("list")
      .doc()
      .set({
        label: input,
        complete: false,
        generated: Date.now()
      })
      .then(() => {
        input = "";
      });
  }

  async function swapItems(e) {
    const { newIndex, oldIndex } = e.detail;

    // const temp = list[oldIndex].generated;
    // list[oldIndex].generated = list[newIndex].generated;
    // list[newIndex].generated = temp;

    let batch = db.batch();
    batch.update(
      db
        .collection("lists")
        .doc(index)
        .collection("list")
        .doc(list[newIndex].id),
      {
        generated: list[oldIndex].generated
      }
    );

    batch.update(
      db
        .collection("lists")
        .doc(index)
        .collection("list")
        .doc(list[oldIndex].id),
      {
        generated: list[newIndex].generated
      }
    );

    batch.commit();
  }

  const [send, receive] = crossfade({
    fallback(node, params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;

      return {
        duration: 700,
        easing: quintOut,
        css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
      };
    }
  });
</script>

{#if list == 'error'}
  <p>No such list</p>
{:else if list == undefined}
  <Spinner />
{:else}
  <div class="d-flex justify-content-around">

  <div class="col-md-8 col-md-offset-2">
    <section use:dndzone={{ list, flipDurationMs }} on:finalize={swapItems}>
      {#each list as item (item.id)}
        <div
          animate:flip={{ duration: flipDurationMs }}
          in:receive={{ key: item.id }}
          out:send={{ key: item.id }}>
          <ListItem {...item} {index} />
        </div>
      {/each}
    </section>

    <div class="input-group">
      <input
        type="text"
        class="form-control"
        aria-label="Default"
        aria-describedby="inputGroup-sizing-default"
        bind:value={input}
        on:keyup={e => e.keyCode == 13 && append()}
        placeholder="Enter something" />
      <button type="button" class="btn btn-primary ml-3" on:click={append}>
        Add
      </button>
    </div>
    </div>
  </div>
{/if}
