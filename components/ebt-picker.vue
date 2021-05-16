<template>
  <div :class="pickerClass"
    >
    <div v-for="(item,i) in items" :key="i"
      :data-index="i"
      :class="itemClass(i)"
      @mouseenter="onMouseEnter($event)"
      @mouseleave="onMouseLeave($event)"
      @touchstart="onTouchStart($event)"
      @touchmove="onTouchMove($event)"
      @touchend="onTouchEnd($event)"
      @touchcancel="onTouchCancel($event)"
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
        let n = 20;
        for (let i=100; i<100+n; i++) {
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
      if (touch == null) {
        return false;
      }
      let { clientX, clientY } = touch;
      let r = elt.getBoundingClientRect();
      let touchesX = r.x <= clientX && clientX <= r.right;
      let touchesY = r.y <= clientY && clientY <= r.bottom;
      return touchesX && touchesY;
    },
    touch(evt, propName="changedTouches") {
      let touches = evt[propName];
      return touches && touches.length === 1 ? touches[0] : null;
    },
    touchTarget(evt, propName="changedTouches") {
      return evt.path[0];
    },
    touchedIndex(evt) {
      let touch = this.touch(evt);
      let { children:siblings } = evt.target.parentElement;
      let index = -1;
      for (let i=0; i<siblings.length; i++) {
        let elt = siblings[i];
        if (this.touchesElement(touch, elt)) {
          index = elt.dataset.index;
        }
      }
      return index;
    },
    onTouchStart(evt) {
      evt.stopPropagation();
      let index = this.touchedIndex(evt);
      Vue.set(this, "iHover", index);
      console.log(`onTouchStart`, {index});
    },
    onTouchMove(evt) {
      evt.stopPropagation();
      let index = this.touchedIndex(evt);
      Vue.set(this, "iHover", index);
    },
    onTouchCancel(evt) {
      evt.stopPropagation();
      Vue.set(this, 'iHover', -1);
      console.log(`onTouchCancel`, evt);
    },
    onTouchEnd(evt) {
      evt.stopPropagation();
      this.onClick(evt);
      Vue.set(this, 'iHover', -1);
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
      let { iHover, items, iLabel, label } = this;
      if (iHover >= 0) {
        console.log(`onClick`, iHover, iLabel, label, evt);
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
      let { iLabel, iHover } = this;
      let classes = ['ebt-picker'];
      classes.push( iLabel === 0
        ? "ebt-picker-left"
        : "ebt-picker-right");
      iHover >= 0 && classes.push('ebt-picker-hover');
      return classes.join(' ');
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
</style>
