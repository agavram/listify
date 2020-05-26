<script>
  import { db } from "../firebase";
  import { goto } from "@sveltech/routify";

  async function newList() {
    const doc = db.collection("lists").doc()
    await doc.collection("list").doc().set({
      generated: Date.now()
    })

    $goto("/lists/" + doc.id);
  }
</script>

<div>

  <div class="d-flex justify-content-around">
    <h1>Hello</h1>
  </div>
  <div class="d-flex justify-content-around">
    <button type="button" class="btn btn-primary" on:click={newList}>
      Make a new list
    </button>
  </div>

</div>
