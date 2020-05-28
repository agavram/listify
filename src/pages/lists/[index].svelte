<script>
  import { flip } from "svelte/animate";
  import { collectionData } from "rxfire/firestore";
  import { db } from "../../firebase";
  import ListItem from "../../_components/ListItem.svelte";
  import { dndzone } from "../../_components/dnd-swap/action.js";

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
</script>

{#if list == 'error'}
  <p>No such list</p>
{:else if list == undefined}
  <p>Loading</p>
{:else}
  <div class="d-flex justify-content-around mt-3">
    <div class="col-6">
      <section use:dndzone={{ list, flipDurationMs }} on:finalize={swapItems}>
        {#each list as item (item.id)}
          <div animate:flip={{ duration: flipDurationMs }}>
            <ListItem {...item} {index} />
          </div>
        {/each}
      </section>
    </div>
  </div>
  <div class="d-flex justify-content-around mt-3">
    <div class="col-6">
      <div class="input-group">
        <input
          type="text"
          class="form-control"
          aria-label="Default"
          aria-describedby="inputGroup-sizing-default"
          bind:value={input}
          on:keyup={(e) => e.keyCode == 13 && append()}
          placeholder="Enter something" />
        <button type="button" class="btn btn-primary ml-3" on:click={append}>
          Add
        </button>
      </div>
    </div>

  </div>
{/if}
