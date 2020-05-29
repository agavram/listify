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
  div span {
    user-select: none;
  }

  div span:hover {
    cursor: pointer;
  }

  .complete {
    color: rgb(28, 172, 28);
    text-decoration: line-through;
  }

  @keyframes strike {
    0% {
      width: 0;
    }
    100% {
      width: 100%;
    }
  }

  svg {
    pointer-events: none;
  }

  .control {
    float: right;
  }

  li {
    padding-left: 10px;
    border: none;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
    transition: 300ms box-shadow;
    margin-bottom: 0.5em;
    border-radius: 0.25em;
  }

  .label {
    transition: 300ms color;
  }
</style>

<li class="list-group-item d-flex justify-content-between align-items-center">
  <div class="handle">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path
        d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2
        2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9
        2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1
        0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9
        2-2-.9-2-2-2z" />
    </svg>
  </div>
  <div class="container">
    <span class="label" class:complete>{label}</span>
    <span class="control" on:click={deleteItem}>🗑️</span>
    <span class="control" on:click={toggleComplete}>✅</span>
  </div>
</li>
