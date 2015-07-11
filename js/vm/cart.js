import ko from "knockout";
import flatten from "lodash/array/flatten";
import sum from "lodash/collection/sum";
import uniq from "lodash/array/uniq";

import Document from "./document";
import store from "../store";
import user from "./user";

export default class Cart {
  constructor(data) {
    Object.assign(this, { name: '', documents: [] }, data);
    if (this.creation_time)
      this.date = new Date(this.creation_time);

    this.documents = this.documents.map(d => new Document(d));

    ko.track(this);

    ko.defineProperty(this, 'totalPageCount', () => sum(this.documents, 'numberOfPages'));

    ko.defineProperty(this, 'includesOral', () =>
      this.documents.some(doc => doc.documentType !== 'written')
    );

    ko.defineProperty(this, 'lectureNames', () => {
      let lectures = uniq(flatten(this.documents.map(doc => doc.lectures)));
      return lectures.map(l => l.name).sort();
    });
  }

  clone() {
    let miniMe = new Cart();
    miniMe.name = this.name;
    miniMe.documents = this.documents.slice();
    return miniMe;
  }

  contains(doc) {
    return this.documents.some(d => d.id === doc.id);
  }

  add(doc) {
    if (!this.contains(doc)) {
      this.documents.push(doc);
    }
  }

  drop(doc) {
    this.documents.remove(doc);
  }

  dropAll() {
    this.documents = [];
  }

  reset() {
    this.dropAll();
    this.name = '';
  }

  save() {
    api.post('orders', {
        name: this.name,
        document_ids: this.documents.map(doc => doc.id)
    }).done(() => this.reset());
  }

  priceEstimate(depositCount) {
    let price = this.totalPageCount * store.config.PRICE_PER_PAGE;
    if (depositCount === undefined) {
      if (this.includesOral) {
        price += store.config.DEPOSIT_PRICE;
      }
    }
    else {
      price += depositCount * store.config.DEPOSIT_PRICE;
    }

    // round to next-highest ten-cent unit
    return Math.ceil(price / 10) * 10;
  }

  get config() { return store.config; }
  get user() { return user; }
}
