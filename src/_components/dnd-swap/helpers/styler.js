const TRANSITION_DURATION_SECONDS = 0.2;

/**
 * private helper function - creates a transition string for a property
 * @param {string} property
 * @return {string} - the transition string
 */
function trs(property) {
    return `${property} ${TRANSITION_DURATION_SECONDS}s ease`;
}
/**
 * clones the given element and applies proper styles and transitions to the dragged element
 * @param {HTMLElement} originalElement
 * @return {Node} - the cloned, styled element
 */
export function createDraggedElementFrom(originalElement) {
    const rect = originalElement.getBoundingClientRect();
    const draggedEl = originalElement.cloneNode(true);
    draggedEl.style.position = "fixed";
    draggedEl.style.top = `${rect.top}px`;
    draggedEl.style.left = `${rect.left}px`;
    draggedEl.style.margin = '0';
    // we can't have relative or automatic height and width or it will break the illusion
    draggedEl.style.boxSizing = 'border-box';
    draggedEl.style.height = `${rect.height}px`;
    draggedEl.style.width = `${rect.width}px`;
    draggedEl.style.transition = `${trs('width')}, ${trs('height')}, ${trs('background-color')}, ${trs('opacity')}, ${trs('color')} `;
    // this is a workaround for a strange browser bug that causes the right border to disappear when all the transitions are added at the same time
    window.setTimeout(() => draggedEl.style.transition +=`, ${trs('top')}, ${trs('left')}`,0);
    const handle = draggedEl.querySelector('.handle');
    handle.style.zIndex = '9999';
    handle.style.cursor = 'grabbing';
    styleShadowEl(originalElement);
    return draggedEl;
}

/**
 * styles the dragged element to a 'dropped' state
 * @param {HTMLElement} draggedEl
 */
export function moveDraggedElementToWasDroppedState(draggedEl) {
    draggedEl.style.cursor = 'grab';
}

/**
 * Morphs the dragged element style, maintains the mouse pointer within the element
 * @param {HTMLElement} draggedEl
 * @param {HTMLElement} copyFromEl - the element the dragged element should look like, typically the shadow element
 * @param {number} currentMouseX
 * @param {number} currentMouseY
 */
export function morphDraggedElementToBeLike(draggedEl, copyFromEl, currentMouseX, currentMouseY) {
    const newRect = copyFromEl.getBoundingClientRect();
    const draggedElRect = draggedEl.getBoundingClientRect();
    const widthChange = newRect.width - draggedElRect.width;
    const heightChange = newRect.height - draggedElRect.height;
    if (widthChange || heightChange) {
        const relativeDistanceOfMousePointerFromDraggedSides = {
            left: (currentMouseX - draggedElRect.left) / draggedElRect.width,
            top: (currentMouseY - draggedElRect.top) / draggedElRect.height
        };
        draggedEl.style.left = `${parseFloat(draggedEl.style.left) - relativeDistanceOfMousePointerFromDraggedSides.left * widthChange}px`;
        draggedEl.style.top = `${parseFloat(draggedEl.style.top) - relativeDistanceOfMousePointerFromDraggedSides.top * heightChange}px`;
    }
}

/**
 * makes the element compatible with being draggable
 * @param {HTMLElement} draggableEl
 */
export function styleDraggable(draggableEl, draggableElHandle) {
    draggableEl.draggable = false;
    draggableEl.ondragstart = () => false;
    draggableElHandle.style.userSelect = 'none';
    draggableElHandle.style.cursor = 'grab';
}

export function styleShadowEl(shadowEl) {
    shadowEl.style.visibility = "hidden";
}