import { window, HTMLElement } from 'global';

class WrapStory extends HTMLElement {
  static get is() {
    return 'wrap-story';
  }

  get template() {
    return '<div id="wrapper"></div>';
  }

  constructor(component, channel, context, storyFn, knobStore) {
    super();

    this.createShadowRoot();
    this.shadowRoot.innerHTML = this.template;

    this.component = component;
    this.channel = channel;
    this.context = context;
    this.storyFn = storyFn;
    this.knobStore = knobStore;

    this.knobChanged = this.knobChanged.bind(this);
    this.knobClicked = this.knobClicked.bind(this);
    this.resetKnobs = this.resetKnobs.bind(this);
    this.setPaneKnobs = this.setPaneKnobs.bind(this);

    this.connectChannel(this.channel);
    this.knobStore.subscribe(this.setPaneKnobs);
    this.render(this.component);
  }

  disconnectedCallback() {
    this.disconnectChannel(this.channel);
    this.knobStore.unsubscribe(this.setPaneKnobs);
  }

  connectChannel(channel) {
    channel.on('addon:knobs:knobChange', this.knobChanged);
    channel.on('addon:knobs:knobClick', this.knobClicked);
    channel.on('addon:knobs:reset', this.resetKnobs);
  }

  disconnectChannel(channel) {
    channel.removeListener('addon:knobs:knobChange', this.knobChanged);
    channel.removeListener('addon:knobs:knobClick', this.knobClicked);
    channel.removeListener('addon:knobs:reset', this.resetKnobs);
  }

  knobChanged(change) {
    const { name, value } = change;
    const { knobStore, storyFn, context } = this;
    // Update the related knob and it's value.
    const knobOptions = knobStore.get(name);

    knobOptions.value = value;
    knobStore.markAllUnused();
    this.render(storyFn(context));
  }

  knobClicked(clicked) {
    const knobOptions = this.knobStore.get(clicked.name);
    knobOptions.callback();
    this.render(this.component);
  }

  resetKnobs() {
    const { knobStore, storyFn, context } = this;
    knobStore.reset();
    this.render(storyFn(context));
    this.setPaneKnobs(this.channel, this.knobStore, false);
  }

  setPaneKnobs(timestamp = +new Date()) {
    const { channel, knobStore } = this;
    channel.emit('addon:knobs:setKnobs', { knobs: knobStore.getAll(), timestamp });
  }

  render(component) {
    const wrapper = this.shadowRoot.querySelector('div#wrapper');
    if (typeof component === 'string') {
      wrapper.innerHTML = component;
    } else {
      wrapper.innerHTML = '';
      wrapper.appendChild(component);
    }
  }
}

window.customElements.define(WrapStory.is, WrapStory);

export default WrapStory;
