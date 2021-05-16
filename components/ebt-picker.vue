<template>
  <div :class="pickerClass"
    @touchstart="onTouchStart($event)"
    @touchmove="onTouchMove($event)"
    @touchend="onTouchEnd($event)"
    @touchcancel="onTouchCancel($event)"
    >
    <div v-for="(item,i) in items" :key="i"
      :data-index="i"
      :class="itemClass(i)"
      @mouseenter="onMouseEnter($event)"
      @mouseleave="onMouseLeave($event)"
      @click="onClick($event)"
    >{{i===iLabel ? label : bullet}}</div>
  </div>
</template>

<script>
import Vue from "vue";
import {
  mdiSquareSmall,
  mdiChevronLeft,
  mdiChevronRight,
  mdiArrowLeft,
} from '@mdi/js';

export default {
  components: {
  },
  props: {
    labelIndex: {
      type: Number,
      default: 0,
    },
    bullet: {
      type: String,
      default: "\u2022",
    },
    justify: {
      type: String,
      default: "center",
    },
    items: {
      type: Array,
      default: ()=>{
        let result = [];
        for (let i=100; i<=102; i++) {
          result.push({
            label: `sn53.${i}/en`,
          });
        }
        return result;
      },
    },
  },
  data: function(){
    return {
      mdiSquareSmall,
      mdiChevronLeft,
      mdiChevronRight,
      mdiArrowLeft,
      suttacentral: false,
      iHover: -1,
    };
  },
  async mounted() {
  },
  methods:{
    touchesElement(touch, elt) {
      let { clientX, clientY, radiusX=0, radiusY=0 } = touch;
      let r = elt.getBoundingClientRect();
      let touchesX = r.x-radiusX <= clientX && clientX <= r.right+radiusX;
      let touchesY = r.y-radiusY <= clientY && clientY <= r.bottom+radiusY;
      console.log(`touchesElement`, touchesX, touchesY, touch, r, elt.dataset);
      return touchesX && touchesY;
    },
    touch(evt, propName="changedTouches") {
      let touches = evt[propName];
      return touches && touches.length === 1 ? touches[0] : null;
    },
    touchTarget(evt, propName="changedTouches") {
      return evt.path[0];
    },
    onTouchStart(evt) {
      let touch = this.touch(evt);
      let target = evt.srcElement;
      if (target) {
        let parent = target.parentElement;
        let rect = parent.getBoundingClientRect();
        console.log(`onTouchStart`, rect, touch);
      }
      target && console.log(`onTouchStart`, target.dataset.index);
    },
    onTouchMove(evt) {
      let target = this.touchTarget(evt);
      target && console.log(`onTouchMove`, target.dataset.index);
    },
    onTouchCancel(evt) {
      let target = this.touchTarget(evt);
      target && console.log(`onTouchCancel`, target.dataset.index);
    },
    onTouchEnd(evt) {
      let { srcElement } = evt;
      let parent = srcElement.parentElement;
      let rect = parent.getBoundingClientRect();
      let touch = this.touch(evt);
      if (touch) {
        let { clientX, clientY, radiusX=0, radiusY=0 } = touch;
        if (rect.x-radiusX <= clientX && clientX <= rect.right+radiusX &&
            rect.y-radiusY <= clientY && clientY <= rect.bottom+radiusY) {
          console.log(`onTouchEnd in`, evt);
        } else {
          console.log(`onTouchEnd out`, evt);
        }
      }
    },
    onMouseEnter(evt) {
      evt.stopPropagation();
      let { target } = evt;
      let { index } = target && target.dataset;
      if (index != null) {
        Vue.set(this, "iHover", index);
        console.debug(`onMouseEnter`, {index});
      }
    },
    onMouseLeave(evt) {
      evt.stopPropagation();
      Vue.set(this, "iHover", -1);
      let { target } = evt;
      let { index } = target && target.dataset;
      console.debug(`onMouseLeave`, {index});
    },
    onClick(evt) {
      let { target } = evt;
      let { index } = target && target.dataset;
      let { iHover, items, iLabel, label } = this;
      if (index != null) {
        console.log(`onClick`, index, iHover, label, evt);
      }
    },
    itemClass(i) {
      let { iHover, iLabel, items } = this;
      if (i === iLabel) {
        return "ebt-picker-item-label";
      }
      if (iHover < 0) {
        return "ebt-picker-item-inactive";
      }
      if (iHover === iLabel) {
        return "ebt-picker-itemN";
      }
      let diffHover = Math.abs(iHover - i);
      switch (diffHover) {
        case 0: return "ebt-picker-item0";
        case 1: return "ebt-picker-item1";
        case 2: return "ebt-picker-item2";
        default: return "ebt-picker-itemN";
      }
    },
  },
  computed: {
    iLabel() {
      let { labelIndex, items } = this;
      return labelIndex >= 0
        ? labelIndex
        : items.length + labelIndex;
    },
    pickerClass() {
      let { iLabel } = this;
      return iLabel === 0
        ? "ebt-picker ebt-picker-left"
        : "ebt-picker ebt-picker-right";
    },
    label() {
      let { iHover, iLabel, items } = this;
      let i = iHover >= 0 ? iHover : iLabel;
      return items[i].label;
    },
  },
}
</script>
<style>
.ebt-picker {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 33%;
  overflow: hidden;
}
.ebt-picker:hover {
  color: var(--ebt-focus-color-light) !important;
}
.ebt-picker-left {
  justify-content: flex-start;
}
.ebt-picker-right {
  justify-content: flex-end;
}
.ebt-picker > div {
  cursor: pointer;
}
.ebt-picker-item0 {
  opacity: 1;
}
.ebt-picker-item1 {
  opacity: 0.6;
}
.ebt-picker-item2 {
  opacity: 0.2;
}
.ebt-picker-itemN {
  opacity: 0.1;
}
.ebt-picker:hover .ebt-picker-item-label {
  font-weight: 700;
  text-decoration: underline;
}
.ebt-picker-item-label {
  padding-left: 0.3em;
  padding-right: 0.3em;
  border-top: 1pt solid rgba(0,0,0,0);
  border-bottom: 1pt solid rgba(0,0,0,0);
}
.ebt-picker-item-inactive {
  opacity: 0;
}
.ebt-picker:hover .ebt-picker-item0,
.ebt-picker:hover .ebt-picker-item1,
.ebt-picker:hover .ebt-picker-item2{
  text-decoration: underline;
}
</style>
