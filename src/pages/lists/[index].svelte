<script>
  import { collectionData } from "rxfire/firestore";
  import { db } from "../../firebase";
  import ListItem from "../../_components/ListItem.svelte";
  import SortableList from "svelte-sortable-list";

  export let index;

  const ref = db
    .collection("lists")
    .doc(index)
    .collection("list")
    .orderBy("generated");
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
    e.preventDefault();
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

  function sortList(e) {
    let swap = [];
    for (let i = 0; i < list.length; i++) {
      if (e.detail[i].id != list[i].id) {
        swap.push(i);
      }
    }
    if (swap.length == 2) {
      swapItems(swap[0], swap[1]);
    }
  }

  async function swapItems(newIndex, oldIndex) {
    let newGenerate = await db
      .collection("lists")
      .doc(index)
      .collection("list")
      .doc(list[newIndex].id)
      .get();
    newGenerate = newGenerate.data().generated;

    let oldGenerate = await db
      .collection("lists")
      .doc(index)
      .collection("list")
      .doc(list[oldIndex].id)
      .get();
    oldGenerate = oldGenerate.data().generated;

    let batch = db.batch();
    batch.update(
      db
        .collection("lists")
        .doc(index)
        .collection("list")
        .doc(list[newIndex].id),
      {
        generated: oldGenerate
      }
    );

    batch.update(
      db
        .collection("lists")
        .doc(index)
        .collection("list")
        .doc(list[oldIndex].id),
      {
        generated: newGenerate
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
      <ul class="list-group">
        <SortableList {list} key="id" on:sort={sortList} let:item>
          <ListItem {...item} {index} />
        </SortableList>
      </ul>
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
          placeholder="Enter something" />
        <button type="button" class="btn btn-primary ml-3" on:click={append}>
          Add
        </button>
      </div>
    </div>

  </div>
{/if}
