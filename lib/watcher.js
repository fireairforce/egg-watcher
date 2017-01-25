'use strict';

const Base = require('sdk-base');
const utils = require('./utils');

module.exports = class Watcher extends Base {
  constructor(options) {
    super();

    let EventSource = options.eventSources[options.type];
    if (typeof EventSource === 'string') {
      EventSource = require(EventSource);
    }

    this._eventSource = new EventSource(options)
      .on('change', this._onChange.bind(this))
      .on('fuzzy-change', this._onFuzzyChange.bind(this))
      .on('error', this.emit.bind(this, 'error'));

    this._eventSource.ready(() => this.ready(true));
  }

  watch(path, callback) {
    if (!path) return;

    // support array
    if (Array.isArray(path)) {
      path.forEach(p => this.watch(p, callback));
      return;
    }

    // skip if the path is already under watching
    if (this._events[path]) return;

    this._eventSource.watch(path);
    this.on(path, callback);
  }

  /*
  // TODO wait unsubscribe implementation of cluster-client
  unwatch(path, callback) {
    if (!path) return;

    // support array
    if (Array.isArray(path)) {
      path.forEach(p => this.unwatch(p, callback));
      return;
    }

    if (callback) {
      this.removeListener(path, callback);
      // stop watching when no listener bound to the path
      if (this.listenerCount(path) === 0) {
        this._eventSource.unwatch(path);
      }
      return;
    }

    this.removeAllListeners(path);
    this._eventSource.unwatch(path);
  }
  */

  _onChange(info) {
    const path = info.path;

    for (const p in this._events) {
      // if it is a sub path, emit a `change` event
      if (utils.isEqualOrParentPath(p, path)) {
        this.emit(p, info);
      }
    }
  }

  _onFuzzyChange(info) {
    const path = info.path;

    for (const p in this._events) {
      // if it is a parent path, emit a `change` event
      // just the oppsite to `_onChange`
      if (utils.isEqualOrParentPath(path, p)) {
        this.emit(p, info);
      }
    }
  }

};