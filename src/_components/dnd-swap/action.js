import { observe, unobserve } from './helpers/observer';
import { armWindowScroller, disarmWindowScroller } from "./helpers/windowScroller";
import {
    createDraggedElementFrom,
    moveDraggedElementToWasDroppedState,
    morphDraggedElementToBeLike,
    styleDraggable,
    styleShadowEl,
} from "./helpers/styler";
import { DRAGGED_ENTERED_EVENT_NAME, DRAGGED_LEFT_EVENT_NAME, DRAGGED_OVER_INDEX_EVENT_NAME, dispatchConsiderEvent, dispatchFinalizeEvent } from './helpers/dispatcher';
const DEFAULT_DROP_ZONE_TYPE = '--any--';
const MIN_OBSERVATION_INTERVAL_MS = 100;
const MIN_MOVEMENT_BEFORE_DRAG_START_PX = 3;

let draggedEl;
let draggedElData;
let draggedElType;
let originDropZone;
let originIndex;
let shadowElIdx;
let shadowElData;
let shadowElDropZone;
let dragStartMousePosition;
let currentMousePosition;
let isWorkingOnPreviousDrag = false;
let lastHighlightEl;

// a map from type to a set of drop-zones
let typeToDropZones = new Map();
// important - this is needed because otherwise the config that would be used for everyone is the config of the element that created the event listeners
let dzToConfig = new Map();

/* drop-zones registration management */
function registerDropZone(dropZoneEl, type) {
    console.debug('registering drop-zone if absent');
    if (!typeToDropZones.has(type)) {
        typeToDropZones.set(type, new Set());
    }
    if (!typeToDropZones.get(type).has(dropZoneEl)) {
        typeToDropZones.get(type).add(dropZoneEl);
    }
}
function unregisterDropZone(dropZoneEl, type) {
    typeToDropZones.get(type).delete(dropZoneEl);
    if (typeToDropZones.get(type).size === 0) {
        typeToDropZones.delete(type);
    }
}

/* functions to manage observing the dragged element and trigger custom drag-events */
function watchDraggedElement() {
    armWindowScroller();
    const dropZones = typeToDropZones.get(draggedElType);
    for (const dz of dropZones) {
        dz.addEventListener(DRAGGED_ENTERED_EVENT_NAME, handleDraggedEntered);
        dz.addEventListener(DRAGGED_LEFT_EVENT_NAME, handleDraggedLeft);
        dz.addEventListener(DRAGGED_OVER_INDEX_EVENT_NAME, handleDraggedIsOverIndex);
    }
    // it is important that we don't have an interval that is faster than the flip duration because it can cause elements to jump bach and forth
    const observationIntervalMs = Math.max(MIN_OBSERVATION_INTERVAL_MS, ...Array.from(dropZones.keys()).map(dz => dzToConfig.get(dz).dropAnimationDurationMs));
    observe(draggedEl, dropZones, observationIntervalMs);
}
function unWatchDraggedElement() {
    disarmWindowScroller();
    const dropZones = typeToDropZones.get(draggedElType);
    for (const dz of dropZones) {
        dz.removeEventListener(DRAGGED_ENTERED_EVENT_NAME, handleDraggedEntered);
        dz.removeEventListener(DRAGGED_LEFT_EVENT_NAME, handleDraggedLeft);
        dz.removeEventListener(DRAGGED_OVER_INDEX_EVENT_NAME, handleDraggedIsOverIndex);
    }
    unobserve(draggedEl, dropZones);
}

/* custom drag-events handlers */
function handleDraggedEntered(e) {
    if (shadowElIdx == undefined) {
        let { items } = dzToConfig.get(e.currentTarget);
        const { index, isProximityBased } = e.detail.indexObj;
        shadowElIdx = (isProximityBased && index === e.currentTarget.children.length - 1) ? index + 1 : index;
        shadowElDropZone = e.currentTarget;
        items.splice(shadowElIdx, 0, shadowElData);
        dispatchConsiderEvent(e.currentTarget, items);
    }
}
function handleDraggedLeft(e) {
    console.log('left');
    if (lastHighlightEl) {
        lastHighlightEl.el.classList.remove("highlight")
        lastHighlightEl = undefined
    }
}
function handleDraggedIsOverIndex(e) {
    console.debug('dragged is over index', e.currentTarget, e.detail);
    const { index, lastIndex } = e.detail.indexObj;
    const { items } = dzToConfig.get(e.currentTarget);
    if (shadowElIdx != index) {
        e.currentTarget.childNodes[index].classList.add("highlight");
    }
    lastHighlightEl = { el: e.currentTarget.childNodes[index], idx: index };
    if (index != lastIndex) {
        e.currentTarget.childNodes[lastIndex].classList.remove("highlight");
    }
    dispatchConsiderEvent(e.currentTarget, items);
}

function handleMouseMove(e) {
    e.preventDefault();
    const c = e.touches ? e.touches[0] : e;
    currentMousePosition = { x: c.clientX, y: c.clientY };
    draggedEl.style.transform = `translate3d(${currentMousePosition.x - dragStartMousePosition.x}px, ${currentMousePosition.y - dragStartMousePosition.y}px, 0)`;
}

function handleDrop() {
    console.debug('dropped');
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('touchmove', handleMouseMove);
    window.removeEventListener('mouseup', handleDrop);
    window.removeEventListener('touchend', handleDrop);
    unWatchDraggedElement();
    moveDraggedElementToWasDroppedState(draggedEl.querySelector('.handle'));
    if (lastHighlightEl) {
        lastHighlightEl.el.classList.remove('highlight');
        originDropZone.dispatchEvent(new CustomEvent('finalize', {
            detail: {oldIndex: shadowElIdx, newIndex: lastHighlightEl.idx}
        }));
    }

    function finalizeBackToOrigin() {
        shadowElDropZone.children[shadowElIdx].style.visibility = '';
        if (lastHighlightEl) {
            shadowElDropZone.children[lastHighlightEl.idx].style.visibility = '';
        }
        cleanupPostDrop();
        isWorkingOnPreviousDrag = false;
    }

    animateDraggedToFinalPosition(finalizeBackToOrigin, lastHighlightEl ? lastHighlightEl.idx : shadowElIdx, shadowElIdx);
}

// helper function for handleDrop
function animateDraggedToFinalPosition(callback, newIndex, oldIndex) {
    const shadowElRect = shadowElDropZone.children[newIndex].getBoundingClientRect();
    const newTransform = {
        x: shadowElRect.left - parseFloat(draggedEl.style.left),
        y: shadowElRect.top - parseFloat(draggedEl.style.top)
    };
    const { dropAnimationDurationMs } = dzToConfig.get(shadowElDropZone);
    const transition = `transform ${dropAnimationDurationMs}ms ease`;
    draggedEl.style.transition = draggedEl.style.transition ? draggedEl.style.transition + "," + transition : transition;
    draggedEl.style.transform = `translate3d(${newTransform.x}px, ${newTransform.y}px, 0)`;
    window.setTimeout(callback, dropAnimationDurationMs);
}

/* cleanup */
function cleanupPostDrop() {
    draggedEl.remove();
    draggedEl = undefined;
    draggedElData = undefined;
    draggedElType = undefined;
    originDropZone = undefined;
    originIndex = undefined;
    shadowElData = undefined;
    shadowElIdx = undefined;
    dragStartMousePosition = undefined;
    currentMousePosition = undefined;
    lastHighlightEl = undefined;
}

/**
 * A Svelte custom action to turn any container to a dnd zone and all of its direct children to draggables
 * dispatches two events that the container is expected to react to by modifying its list of items,
 * which will then feed back in to this action via the update function
 *
 * @typedef {Object} Options
 * @property {Array} items - the list of items that was used to generate the children of the given node (the list used in the #each block
 * @property {string} [type] - the type of the dnd zone. children dragged from here can only be dropped in other zones of the same type, default to a base type
 * @property {number} [flipDurationMs] - if the list animated using flip (recommended), specifies the flip duration such that everything syncs with it without conflict, defaults to zero
 * @param {HTMLElement} node - the element to enhance
 * @param {Options} options
 * @return {{update: function, destroy: function}}
 */
export function dndzone(node, options) {
    const config = { items: [], type: undefined };
    console.debug("dndzone good to go", { node, options, config });
    let elToIdx = new Map();
    // used before the actual drag starts
    let potentialDragTarget;

    function addMaybeListeners() {
        window.addEventListener('mousemove', handleMouseMoveMaybeDragStart, { passive: false });
        window.addEventListener('touchmove', handleMouseMoveMaybeDragStart, { passive: false, capture: false });
        window.addEventListener('mouseup', handleFalseAlarm, { passive: false });
        window.addEventListener('touchend', handleFalseAlarm, { passive: false });
    }
    function removeMaybeListeners() {
        window.removeEventListener('mousemove', handleMouseMoveMaybeDragStart);
        window.removeEventListener('touchmove', handleMouseMoveMaybeDragStart);
        window.removeEventListener('mouseup', handleFalseAlarm);
        window.removeEventListener('touchend', handleFalseAlarm);
    }
    function handleFalseAlarm() {
        console.debug('false alarm');
        potentialDragTarget.querySelector('.handle').style.cursor = "grab";
        removeMaybeListeners();
        potentialDragTarget = undefined;
        dragStartMousePosition = undefined;
        currentMousePosition = undefined;
    }

    function handleMouseMoveMaybeDragStart(e) {
        e.preventDefault();
        // const c = e.touches ? e.touches[0] : e;
        // currentMousePosition = { x: c.clientX, y: c.clientY };
        // if (Math.abs(currentMousePosition.x - dragStartMousePosition.x) >= MIN_MOVEMENT_BEFORE_DRAG_START_PX || Math.abs(currentMousePosition.y - dragStartMousePosition.y) >= MIN_MOVEMENT_BEFORE_DRAG_START_PX) {
        removeMaybeListeners();
        handleDragStart(potentialDragTarget);
        potentialDragTarget.querySelector('.handle').style.cursor = "grab";
        potentialDragTarget = undefined;
        // }
    }

    function handleMouseDown(e) {
        const c = e.touches ? e.touches[0] : e;
        if (!c.target.classList.contains('handle')) {
            return false;
        }
        e.target.style.cursor = "grabbing";
        dragStartMousePosition = { x: c.clientX, y: c.clientY };
        currentMousePosition = { ...dragStartMousePosition };
        potentialDragTarget = e.currentTarget;
        addMaybeListeners();
    }

    function handleDragStart(dragTarget) {
        console.debug('drag start', dragTarget, { config });
        if (isWorkingOnPreviousDrag) {
            console.debug('cannot start a new drag before finalizing previous one');
            return;
        }
        isWorkingOnPreviousDrag = true;

        // initialising globals
        const currentIdx = elToIdx.get(dragTarget);
        originIndex = currentIdx;
        originDropZone = dragTarget.parentNode;
        const { items, type } = config;
        draggedElData = { ...items[currentIdx] };
        draggedElType = type;
        shadowElData = { ...draggedElData, isDndShadowItem: true };

        // creating the draggable element
        draggedEl = createDraggedElementFrom(dragTarget);
        document.body.appendChild(draggedEl);
        // styleActiveDropZones(typeToDropZones.get(config.type));

        // removing the original element by removing its data entry
        items.splice(currentIdx, 1);
        dispatchConsiderEvent(originDropZone, items);

        // handing over to global handlers - starting to watch the element
        window.addEventListener('mousemove', handleMouseMove, { passive: false });
        window.addEventListener('touchmove', handleMouseMove, { passive: false, capture: false });
        window.addEventListener('mouseup', handleDrop, { passive: false });
        window.addEventListener('touchend', handleDrop, { passive: false });
        watchDraggedElement();
    }

    function configure(opts) {
        console.debug(`configuring ${JSON.stringify(opts)}`);
        config.dropAnimationDurationMs = opts.flipDurationMs || 0;
        const newType = opts.type || DEFAULT_DROP_ZONE_TYPE;
        if (config.type && newType !== config.type) {
            unregisterDropZone(node, config.type);
        }
        config.type = newType;
        registerDropZone(node, newType);

        config.items = opts.items || [];
        dzToConfig.set(node, config);
        for (let idx = 0; idx < node.children.length; idx++) {
            const draggableEl = node.children[idx];
            styleDraggable(draggableEl, draggableEl.querySelector('.handle'));
            if (!elToIdx.has(draggableEl)) {
                draggableEl.addEventListener('mousedown', handleMouseDown);
                draggableEl.addEventListener('touchstart', handleMouseDown);
            }
            // updating the idx
            elToIdx.set(draggableEl, idx);
        }
    }
    configure(options);

    return ({
        update: (newOptions) => {
            console.debug("dndzone will update", newOptions);
            configure(newOptions);
        },
        destroy: () => {
            console.debug("dndzone will destroy");
            unregisterDropZone(node, config.type);
            dzToConfig.delete(node);
        }
    });
}