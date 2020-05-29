<style>
  .spinner {
    width: 60px;
    height: 60px;
    box-sizing: border-box;
    position: relative;
    border: 3px solid transparent;
    border-top-color: #ff3e00;
    border-radius: 50%;
    animation: spin 2s ease-in-out infinite;
  }
  .spinner:before,
  .spinner:after {
    content: "";
    box-sizing: border-box;
    position: absolute;
    border: 3px solid transparent;
    border-radius: 50%;
  }
  .spinner:after {
    border-top-color: #676778;
    top: 9px;
    left: 9px;
    right: 9px;
    bottom: 9px;
    animation: spin 2s ease-out infinite !important;
  }
  .spinner:before {
    border-top-color: #40b3ff;
    top: 3px;
    left: 3px;
    right: 3px;
    bottom: 3px;
    animation: spin 2s ease-in infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>

<div class="d-flex justify-content-around">
  <div class="spinner"/>
</div>
