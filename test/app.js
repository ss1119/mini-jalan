"use strict";

const _ = require("./i18n").text;
const jsdom = require("jsdom");
const { JSDOM, VirtualConsole } = jsdom;
const expect = require("chai").expect;
const got = require("got");
const fetch = require("node-fetch");
const { ms, traverse } = require("./util");
const cp = require("child_process");

class App {
  static async create(server) {
    const http = cp.spawn("python3", ["-m", "http.server", "8888"], { cwd: "./public" });
    const virtualConsole = new VirtualConsole();
    const domOption = {
      resources: "usable",
      runScripts: "dangerously",
      virtualConsole,
    };
    const dom = await App.retrieveDOM("http://localhost:8888/", domOption, 0);
    dom.window.Element.prototype.__defineGetter__("innerText", function () {
      return this.textContent;
    });
    dom.window.Element.prototype.__defineSetter__("innerText", function (val) {
      this.textContent = val;
    });
    dom.window.requestAnimationFrame = () => { };
    dom.window.fetch = fetch;
    await ms();
    const app = new App(dom, server, http);
    await ms(1000);
    virtualConsole.sendTo(console);
    return app;
  }

  static async retrieveDOM(url, domOptions, retryCount) {
    await ms(500);
    try {
      return await JSDOM.fromURL(url, domOptions);
    } catch (e) {
      if (retryCount >= 10) {
        throw e;
      }
      return await App.retrieveDOM(url, domOptions, retryCount + 1);
    }
  }

  constructor(dom, server, http) {
    this.dom = dom;
    this.server = server;
    this.http = http;
    this.token = this.uuid();
    const document = dom.window.document;
    this.elements = {
      accessToken: () => document.querySelector("input[type='text']#access_token"),
      tokenCheck: () => document.querySelector("button#token_check"),
      keyword: () => document.querySelector("input[type='text']#keyword"),
      search: () => document.querySelector("button#search"),
      hotels: () => [].filter.call(document.querySelectorAll("[id^=hotel-]"), (e) => e.id.match(/^hotel-\d+$/)),
      hotelId: (id) => document.querySelector(`#hotel-${id}`),
      hotelName: (hotel, id) => hotel.querySelector(`#hotel-name-${id}`),
      hotelAddress: (hotel, id) => hotel.querySelector(`#hotel-address-${id}`),
      plans: (hotel) => [].filter.call(hotel.querySelectorAll("[id^=plan-]"), (e) => e.id.match(/^plan-\d+$/)),
      planId: (hotel, id) => hotel.querySelector(`#plan-${id}`),
      planName: (plan, id) => plan.querySelector(`#plan-name-${id}`),
      planRoom: (plan, id) => plan.querySelector(`#plan-room-${id}`),
      planPrice: (plan, id) => plan.querySelector(`#plan-price-${id}`),
      prefecture: () => document.querySelector("select#prefecture"),
      checkin: () => document.querySelector("input[type='date']#checkin"),
      checkout: () => document.querySelector("input[type='date']#checkout"),
      number: () => document.querySelector("input[type='number']#number"),
      planTotalPrice: (plan, id) => plan.querySelector(`#plan-total-price-${id}`),
      planReserve: (plan, id) => plan.querySelector(`button#plan-reserve-${id}`),
      message: () => document.querySelector("#message"),
    };
  }

  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .split('')
      .map(c => {
        switch (c) {
          case 'x': return (Math.random() * 16 | 0).toString(16);
          case 'y': return ((Math.random() * 4 | 0) + 8).toString(16);
          default: return c;
        }
      })
      .join('');
  }

  async tokenCheck() {
    const accessToken = this.elements.accessToken();
    const tokenCheck = this.elements.tokenCheck();
    expect(accessToken, _`#access_token 要素がみつかりません`).to.exist;
    expect(tokenCheck, _`#token_check 要素がみつかりません`).to.exist;
    await this._input(accessToken, this.token);
    await this._click(tokenCheck);
    await ms(2000);
    return this.token;
  }

  async search({ keyword, prefecture, checkin, checkout, number, advanced }) {
    const elements = {};
    elements.keyword = this.elements.keyword();
    expect(elements.keyword, _`#keyword 要素が見つかりません`).to.exist;
    elements.prefecture = this.elements.prefecture();
    elements.checkin = this.elements.checkin();
    elements.checkout = this.elements.checkout();
    elements.number = this.elements.number();
    if (advanced) {
      expect(elements.prefecture, _`#prefecture 要素が見つかりません`).to.exist;
      expect(elements.checkin, _`#checkin 要素が見つかりません`).to.exist;
      expect(elements.checkout, _`#checkout 要素が見つかりません`).to.exist;
      expect(elements.number, _`#number 要素が見つかりません`).to.exist;
    }

    // 拡張済みの場合、prefecture~numberの項目が存在しないと検索が出来ないので、Step 2でも入力は行う
    await this._input(elements.keyword, keyword);
    if (elements.prefecture) {
      await this._input(elements.prefecture, prefecture);
    }
    if (elements.checkin) {
      await this._input(elements.checkin, checkin);
    }
    if (elements.checkout) {
      await this._input(elements.checkout, checkout);
    }
    if (elements.number) {
      await this._input(elements.number, number);
    }

    const search = this.elements.search();
    expect(search, _`#search 要素が見つかりません`).to.exist;
    await this._click(search);

    await ms(3000);
  }

  async stats() {
    return (await got(`${this.server}/admin/_stat`, {
      responseType: "json",
      headers: {
        "X-ACCESS-TOKEN": this.token,
      }
    })).body;
  }

  async close() {
    this.http.kill();
    await got(`${this.server}/admin/_close`, {
      headers: {
        "X-ACCESS-TOKEN": this.token,
      }
    });
  }


  async _input(el, value) {
    if (!el) {
      return;
    }
    let lastValue = el.value;
    el.value = value;
    let event = new this.dom.window.InputEvent("input", { bubbles: true });

    // hack for React15
    event.simulated = true;

    // hack for React 16
    let tracker = el._valueTracker;
    if (tracker) {
      tracker.setValue(lastValue);
    }

    el.dispatchEvent(event);
    el.dispatchEvent(new this.dom.window.Event("change", { bubbles: true }));
    await ms();
  }

  async _click(el) {
    if (el.click) {
      el.click();
    } else {
      el.dispatchEvent(new this.dom.window.Event("click", { bubbles: true, cancelable: true }));
    }
    await ms();
  }
}

module.exports = App;
