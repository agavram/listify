<script>
  import { db } from "../firebase";

  export let label;
  export let complete;
  export let generated;
  export let id;
  export let index;

  async function toggleComplete() {
    db.collection("lists")
      .doc(index)
      .collection("list")
      .doc(id)
      .update({
        complete: !complete
      });
  }

  async function deleteItem() {
    db.collection("lists")
      .doc(index)
      .collection("list")
      .doc(id)
      .delete();
  }
</script>

<style>
  span {
    user-select: none;
  }

  span:hover {
    cursor: pointer;
  }

  .complete {
    color: rgb(28, 172, 28);
  }
</style>

<li
  class="list-group-item d-flex justify-content-between align-items-center"
  class:complete>
  {label}
  <div>
    <span on:click={toggleComplete}>✅</span>
    <span on:click={deleteItem}>🗑️</span>
  </div>
</li>
