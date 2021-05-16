<template>
  <div :class="pickerClass"
    >
    <v-icon v-if="labelIndex>=0" >{{mdiChevronRight}}</v-icon>
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
    <v-icon v-if="labelIndex<0" >{{mdiChevronLeft}}</v-icon>
  </div>
</template>

<script>
import Vue from "vue";
import {
  mdiChevronLeft,
  mdiChevronRight,
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
      mdiChevronLeft,
      mdiChevronRight,
      suttacentral: false,
      iHover: -1,
    };
  },
  async mounted() {
    console.debug('ebtPicker.mounted');
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
      console.debug(`onTouchStart`, {index});
    },
    onTouchMove(evt) {
      evt.stopPropagation();
      let index = this.touchedIndex(evt);
      Vue.set(this, "iHover", index);
    },
    onTouchCancel(evt) {
      evt.stopPropagation();
      Vue.set(this, 'iHover', -1);
      console.debug(`onTouchCancel`, evt);
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
        console.debug(`onClick`, iHover, label, evt);
        this.$emit('ebt-pick-item', {index:iHover, label});
      }
      Vue.set(this, 'iHover', -1);
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
      let { iLabel, iHover, labelIndex } = this;
      let classes = ['ebt-picker'];
      classes.push( labelIndex < 0
        ? "ebt-picker-right"
        : "ebt-picker-left");
      iHover >= 0 && classes.push('ebt-picker-hover');
      return classes.join(' ');
    },
    label() {
      let { iHover, iLabel, items } = this;
      let i = iHover >= 0 ? iHover : iLabel;
      let item = items[i];
      let label = item && item.label;
      if (!label) {
        return "--";
      }
      return label;
    },
  },
}
</script>
<style>
</style>
