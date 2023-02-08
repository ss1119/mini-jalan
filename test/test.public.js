"use strict";

const _ = require("./i18n").text;
const expect = require("chai").expect;
const got = require("got");
const App = require("./app");
const u = require("./util");

const API_SERVER = "https://track-challenge-api-labrat.herokuapp.com/hotel-reservation";
const searches = require("./searches.json");
const reserves = require("./reserves.json");

describe("", function () {
  this.timeout(30000);

  let app;
  beforeEach("", async () => {
    app = await App.create(API_SERVER);
  });

  afterEach(async () => {
    app.close();
  });

  it(_`[Step 1] アクセス・トークン処理の要素が存在する`, async () => {
    expect(app.elements.accessToken(), _`要件を満たす #access_token 要素がみつかりません`).to.exist;
    expect(app.elements.tokenCheck(), _`要件を満たす #token_check 要素がみつかりません`).to.exist;
  });

  it(_`[Step 1] #access_token は初期状態で有効である`, async () => {
    const el = app.elements.accessToken();
    expect(el, _`#access_token 要素が見つかりません`).to.exist;
    expect(el.disabled, _`#access_token 要素が無効です`).to.be.false;
  });

  it(_`[Step 1] #access_token に有効なトークンを入力した場合に限り、#token_check が有効になる`, async () => {
    expect(app.elements.accessToken(), _`要素がみつかりません`).to.exist;
    expect(app.elements.tokenCheck(), _`要素がみつかりません`).to.exist;

    const tests = [
      [_`UUID`, app.uuid(), false],
      [_`UUID`, app.uuid(), false],
      [_`UUID`, app.uuid(), false],
      [_`空文字列`, "", true],
      [_`文字列「a」`, "a", true],
      [_`UUID (v1)`, "6f308468-b879-11ea-b3de-0242ac130004", true],
      [_`UUID (v4; 大文字)`, "1ae903cf-f9f4-4c69-bbaa-6726b1edeccd".toUpperCase(), true],
      [_`UUID (v4;ハイフンなし)`, "1ae903cf-f9f4-4c69-bbaa-6726b1edeccd".replace(/-/g), true],
    ];

    for (const [title, input, expected] of tests) {
      const el = app.elements.accessToken();
      const prevVal = el.value;
      el.value = input;
      const e = new app.dom.window.Event("input", { bubbles: true });
      e.simulated = true;
      const tracker = el._valueTracker;
      if (tracker) {
        tracker.setValue(prevVal);
      }
      el.dispatchEvent(e);
      await u.ms();
      expect(app.elements.tokenCheck().disabled,
        expected ? _`${title} を入力したとき、#token_check が有効です`
          : _`${title} を入力したとき、#token_check が無効です`
      ).to.be.equal(expected);
    }
  });

  it(_`[Step 1] #token_check をクリックしたら #access_token、#token_check はともに無効化される`, async () => {
    await app.tokenCheck();

    expect(app.elements.tokenCheck().disabled, _`#token_check が有効です`).to.be.true;
    expect(app.elements.accessToken().disabled, _`#access_token が有効です`).to.be.true;
  });

  it(_`[Step 1] #token_check をクリックしたらアクセス・トークンを確認するリクエストが発行される`, async () => {
    await app.tokenCheck();

    const stats = await app.stats();
    expect(Object.keys(stats.stat), _`アクセス・トークンを確認するリクエストが発行されていません`).to.include.members(["GET /hotel-reservation/token-check"]);
  });

  it(_`[Step 2] トークンチェック済の状態で検索をするための要素が存在する`, async () => {
    await app.tokenCheck();

    expect(app.elements.keyword(), _`要件を満たす #keyword 要素がみつかりません`).to.exist;
    expect(app.elements.search(), _`要件を満たす #search 要素がみつかりません`).to.exist;
  });

  it(_`[Step 2] 検索を行うことでホテル・アイテム及びプラン・アイテムが適切に設定される`, async () => {
    // どんなリクエストを行ったかやどんな結果を表示しているかは問わない
    await app.tokenCheck();
    await app.search({
      keyword: "",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: false,
    });

    const hotels = app.elements.hotels();
    expect(hotels, _`要件を満たすホテルIDの要素が存在しません`).not.to.be.empty;
    for (const hotel of hotels) {
      const hotelId = hotel.id.match(/hotel-(\d+)/)[1];
      const hotelNameId = `#hotel-name-${hotelId}`;
      const hotelName = hotel.querySelectorAll(hotelNameId);
      expect(hotelName, _`#${hotel.id} の子要素として ${hotelNameId} が 1 つのみ存在すべきですが、 ${hotelName.length} つ存在します`).to.have.lengthOf(1);

      const hotelAddressId = `#hotel-address-${hotelId}`;
      const hotelAddress = hotel.querySelectorAll(hotelAddressId);
      expect(hotelAddress, _`#${hotel.id} の子要素として ${hotelAddressId} が 1 つのみ存在すべきですが、 ${hotelAddress.length} つ存在します`).to.have.lengthOf(1);

      const plans = app.elements.plans(hotel);
      expect(plans, _`要件を満たすプランIDの要素が存在しません`).not.to.be.empty;
      for (const plan of plans) {
        const planId = plan.id.match(/plan-(\d+)/)[1];
        const planNameId = `#plan-name-${planId}`
        const planName = plan.querySelectorAll(planNameId);
        expect(planName, _`#${plan.id} の子要素として ${planNameId} が 1 つのみ存在すべきですが、 ${planName.length} つ存在します`).to.have.lengthOf(1);

        const planRoomId = `#plan-room-${planId}`;
        const planRoom = plan.querySelectorAll(planRoomId);
        expect(planRoom, _`#${plan.id} の子要素として ${planRoomId} が 1 つのみ存在すべきですが、 ${planRoom.length} つ存在します`).to.have.lengthOf(1);

        const planPriceId = `#plan-price-${planId}`;
        const planPrice = plan.querySelectorAll(planPriceId);
        expect(planPrice, _`#${plan.id} の子要素として ${planPriceId} が 1 つのみ存在すべきですが、 ${planPrice.length} つ存在します`).to.have.lengthOf(1);
      }
    }
  });

  it(_`[Step 2] 正しいホテル・アイテム及びプラン・アイテムを表示している`, async () => {
    await app.tokenCheck();

    if (app.elements.prefecture() || app.elements.checkin() || app.elements.checkout() || app.elements.number()) {
      console.log("this test should be skipped");
      return;
    }

    for (const test of searches) {
      if (test.advanced) {
        continue;
      }
      await app.search({
        keyword: test.input.keyword,
        advanced: false,
      });

      for (const output of test.output) {
        const hotel = app.elements.hotelId(output.id);
        expect(hotel, _`#hotel-${output.id} が存在しません`).to.exist;

        const hotelName = app.elements.hotelName(hotel, output.id);
        expect(hotelName, _`#hotel-${output.id} 内に #hotel-name-${output.id} が存在しません`).to.exist;
        expect(hotelName.textContent, _`#hotel-name-${output.id} の中身は ${output.name} であるべきですが、${hotelName.textContent} になっています`).to.equal(output.name);

        const hotelAddress = app.elements.hotelAddress(hotel, output.id);
        expect(hotelAddress, _`#hotel-${output.id} 内に #hotel-address-${output.id} が存在しません`).to.exist;
        expect(hotelAddress.textContent, _`#hotel-address-${output.id} の中身は ${output.address} であるべきですが、${hotelAddress.textContent} になっています`).to.equal(output.address);

        for (const plans of output.plans) {
          const expectedRoom = output.rooms.filter((room) => room.id === plans[0].room_id)[0];
          for (const plan of plans) {
            const planElement = app.elements.planId(hotel, plan.id);
            expect(planElement, _`#hotel-${output.id} 内に #plan-${plan.id} が存在しません`).to.exist;

            const planName = app.elements.planName(planElement, plan.id);
            expect(planName, _`#plan-${plan.id} 内に #plan-name-${plan.id} が存在しません`).to.exist;
            expect(planName.textContent, `#plan-name-${plan.id} の中身は ${plan.name} であるべきですが、${planName.textContent} になっています`).equal(plan.name);

            const roomName = app.elements.planRoom(planElement, plan.id);
            expect(roomName, _`#plan-${plan.id} 内に #plan-room-${plan.id} が存在しません`).to.exist;
            expect(roomName.textContent, `#plan-room-${plan.id} の中身は ${expectedRoom.name} であるべきですが、${roomName.textContent} になっています`).to.equal(expectedRoom.name);

            const planPrice = app.elements.planPrice(planElement, plan.id);
            expect(planPrice, _`#plan-${plan.id} 内に #plan-price-${plan.id} が存在しません`).to.exist;
            const price = planPrice.textContent.match(/\d+/);
            expect(price, _`#plan-price-${plan.id} の中身が /\\d+/ にマッチしません`).not.to.be.null;
            expect(parseInt(price), _`#plan-price-${plan.id} の料金は ${plan.price} であるべきですが、${price} になっています`).to.equal(plan.price);
          }
        }
      }
    }
  });

  it(_`[Step 2] 検索時にリクエストを送信している`, async () => {
    await app.tokenCheck();

    if (app.elements.prefecture() || app.elements.checkin() || app.elements.checkout() || app.elements.number()) {
      console.log("this test should be skipped");
      return;
    }

    await app.search({
      keyword: "東京",
      advanced: false,
    });

    const stats = await app.stats();
    const paths = Object.keys(stats.stat).filter(path => path.match("GET /hotel-reservation/hotels"));
    expect(paths, _`/hotels の API 呼び出しがされていません`).not.to.be.empty;
    const validUrls = paths.filter((path) => {
      const url = new URL("https://track-challenge-api-labrat.herokuapp.com" + path.split(" ")[1]);
      return url.searchParams.get("keyword") === "東京";
    });
    expect(validUrls, _`/hotels の API 呼び出しに十分なパラメータ設定がされていません`).not.to.be.empty;
  });

  it(_`[Step 3] トークンチェック済の状態で検索をするための要素が存在する`, async () => {
    await app.tokenCheck();

    expect(app.elements.keyword(), _`要件を満たす #keyword 要素がみつかりません`).to.exist;
    expect(app.elements.search(), _`要件を満たす #search 要素がみつかりません`).to.exist;
    const prefecture = app.elements.prefecture();
    expect(prefecture, _`要件を満たす #prefecture 要素がみつかりません`).to.exist;
    for (let i = 1; i <= 47; i++) {
      const prefectureOption = prefecture.querySelector(`option[value="${i}"]`);
      expect(prefectureOption, _`#prefecture 内に option value="${i}" が存在しません`).to.exist;
    }
    expect(app.elements.checkin(), _`要件を満たす #checkin 要素がみつかりません`).to.exist;
    expect(app.elements.checkout(), _`要件を満たす #checkout 要素がみつかりません`).to.exist;
    expect(app.elements.number(), _`要件を満たす #number 要素がみつかりません`).to.exist;
  });

  it(_`[Step 3] 検索をするための要素にデフォルト値が入力されている`, async () => {
    await app.tokenCheck();

    const checkin = app.elements.checkin();
    expect(checkin, _`要件を満たす #checkin 要素がみつかりません`).to.exist;
    expect(checkin.value, _`#checkin のデフォルト値は ${u.getDate(0)} であるべきですが、${checkin.value} になっています`).to.equal(u.getDate(0));

    const checkout = app.elements.checkout();
    expect(checkout, _`要件を満たす #checkout 要素がみつかりません`).to.exist;
    expect(checkout.value, _`#checkout のデフォルト値は ${u.getDate(1)} であるべきですが、${checkout.value} になっています`).to.equal(u.getDate(1));

    const number = app.elements.number();
    expect(number, _`要件を満たす #number 要素がみつかりません`).to.exist;
    expect("" + number.value, _`#number のデフォルト値は 2 であるべきですが、${number} になっています`).to.equal("2");
  });

  it(_`[Step 3] 検索を行うことでホテル・アイテム及びプラン・アイテムが適切に設定される`, async () => {
    // どんなリクエストを行ったかやどんな結果を表示しているかは問わない
    await app.tokenCheck();

    await app.search({
      keyword: "",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: true,
    });

    const hotels = app.elements.hotels();
    expect(hotels, _`要件を満たすホテルIDの要素が存在しません`).not.to.be.empty;
    for (const hotel of hotels) {
      const hotelId = hotel.id.match(/hotel-(\d+)/)[1];
      const hotelNameId = `#hotel-name-${hotelId}`;
      const hotelName = hotel.querySelectorAll(hotelNameId);
      expect(hotelName, _`#${hotel.id} の子要素として ${hotelNameId} が 1 つのみ存在すべきですが、 ${hotelName.length} つ存在します`).to.have.lengthOf(1);

      const hotelAddressId = `#hotel-address-${hotelId}`;
      const hotelAddress = hotel.querySelectorAll(hotelAddressId);
      expect(hotelAddress, _`#${hotel.id} の子要素として ${hotelAddressId} が 1 つのみ存在すべきですが、 ${hotelAddress.length} つ存在します`).to.have.lengthOf(1);

      const plans = app.elements.plans(hotel);
      expect(plans, _`要件を満たすプランIDの要素が存在しません`).not.to.be.empty;
      for (const plan of plans) {
        const planId = plan.id.match(/plan-(\d+)/)[1];
        const planNameId = `#plan-name-${planId}`
        const planName = plan.querySelectorAll(planNameId);
        expect(planName, _`#${plan.id} の子要素として ${planNameId} が 1 つのみ存在すべきですが、 ${planName.length} つ存在します`).to.have.lengthOf(1);

        const planRoomId = `#plan-room-${planId}`;
        const planRoom = plan.querySelectorAll(planRoomId);
        expect(planRoom, _`#${plan.id} の子要素として ${planRoomId} が 1 つのみ存在すべきですが、 ${planRoom.length} つ存在します`).to.have.lengthOf(1);

        const planPriceId = `#plan-price-${planId}`;
        const planPrice = plan.querySelectorAll(planPriceId);
        expect(planPrice, _`#${plan.id} の子要素として ${planPriceId} が 1 つのみ存在すべきですが、 ${planPrice.length} つ存在します`).to.have.lengthOf(1);

        const planTotalPriceId = `#plan-total-price-${planId}`;
        const planTotalPrice = plan.querySelectorAll(planTotalPriceId);
        expect(planTotalPrice, _`#${plan.id} の子要素として ${planTotalPriceId} が 1 つのみ存在すべきですが、 ${planTotalPrice.length} つ存在します`).to.have.lengthOf(1);
      }
    }
  });

  it(_`[Step 3] 正しいホテル・アイテム及びプラン・アイテムを表示している`, async () => {
    await app.tokenCheck();

    for (const test of searches) {
      if (!test.input.advanced) {
        continue;
      }
      await app.search({
        keyword: test.input.keyword,
        prefecture: test.input.prefecture,
        checkin: u.getDate(test.input.checkin),
        checkout: u.getDate(test.input.checkout),
        number: test.input.number,
        advanced: true,
      });

      for (const output of test.output) {
        const hotel = app.elements.hotelId(output.id);
        expect(hotel, _`#hotel-${output.id} が存在しません`).to.exist;

        const hotelName = app.elements.hotelName(hotel, output.id);
        expect(hotelName, _`#hotel-${output.id} 内に #hotel-name-${output.id} が存在しません`).to.exist;
        expect(hotelName.textContent, _`#hotel-name-${output.id} の中身は ${output.name} であるべきですが、${hotelName.textContent} になっています`).to.equal(output.name);

        const hotelAddress = app.elements.hotelAddress(hotel, output.id);
        expect(hotelAddress, _`#hotel-${output.id} 内に #hotel-address-${output.id} が存在しません`).to.exist;
        expect(hotelAddress.textContent, _`#hotel-address-${output.id} の中身は ${output.address} であるべきですが、${hotelAddress.textContent} になっています`).to.equal(output.address);

        for (const plans of output.plans) {
          const expectedRoom = output.rooms.filter((room) => room.id === plans[0].room_id)[0];
          for (const plan of plans) {
            const planElement = app.elements.planId(hotel, plan.id);
            expect(planElement, _`#hotel-${output.id} 内に #plan-${plan.id} が存在しません`).to.exist;

            const planName = app.elements.planName(planElement, plan.id);
            expect(planName, _`#plan-${plan.id} 内に #plan-name-${plan.id} が存在しません`).to.exist;
            expect(planName.textContent, `#plan-name-${plan.id} の中身は ${plan.name} であるべきですが、${planName.textContent} になっています`).equal(plan.name);

            const roomName = app.elements.planRoom(planElement, plan.id);
            expect(roomName, _`#plan-${plan.id} 内に #plan-room-${plan.id} が存在しません`).to.exist;
            expect(roomName.textContent, `#plan-room-${plan.id} の中身は ${expectedRoom.name} であるべきですが、${roomName.textContent} になっています`).to.equal(expectedRoom.name);

            const planPrice = app.elements.planPrice(planElement, plan.id);
            expect(planPrice, _`#plan-${plan.id} 内に #plan-price-${plan.id} が存在しません`).to.exist;
            const price = planPrice.textContent.match(/\d+/);
            expect(price, _`#plan-price-${plan.id} の中身が /\\d+/ にマッチしません`).not.to.be.null;
            expect(parseInt(price), _`#plan-price-${plan.id} の料金は ${plan.price} であるべきですが、${price} になっています`).to.equal(plan.price);

            const totalPlanPrice = app.elements.planTotalPrice(planElement, plan.id);
            expect(totalPlanPrice, _`#plan-${plan.id} 内に #plan-total-price-${plan.id} が存在しません`).to.exist;
            const totalPrice = totalPlanPrice.textContent.match(/\d+/);
            expect(totalPrice, _`#plan-total-price-${plan.id} の中身が /\\d+/ にマッチしません`).not.to.be.null;
            const expectedTotalPrice = test.input.number * (test.input.checkout - test.input.checkin) * plan.price;
            expect(parseInt(totalPrice), _`#plan-total-price-${plan.id} の料金は ${expectedTotalPrice} であるべきですが、${totalPrice} になっています`).to.equal(expectedTotalPrice);
          }
        }
      }
    }
  });

  it(_`[Step 3] 検索時にリクエストを送信している`, async () => {
    await app.tokenCheck();

    await app.search({
      keyword: "横浜",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: true,
    });

    const stats = await app.stats();
    const paths = Object.keys(stats.stat).filter(path => path.match("GET /hotel-reservation/hotels"));
    expect(paths, _`/hotels の API 呼び出しがされていません`).not.to.be.empty;
    const validUrls = paths.filter((path) => {
      const url = new URL("https://track-challenge-api-labrat.herokuapp.com" + path.split(" ")[1]);
      return url.searchParams.get("keyword") === "横浜" &&
        url.searchParams.get("prefecture") === "12" &&
        url.searchParams.get("checkin") === u.getDate(0) &&
        url.searchParams.get("checkout") === u.getDate(1) &&
        url.searchParams.get("number") === "2";
    });
    expect(validUrls, _`/hotels の API 呼び出しに十分なパラメータ設定がされていません`).not.to.be.empty;
  });

  it(_`[Step 4] プラン・アイテムに予約ボタンを追加している`, async () => {
    await app.tokenCheck();

    await app.search({
      keyword: "",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: true,
    });

    const hotels = app.elements.hotels();
    expect(hotels, _`要件を満たすホテルIDの要素が存在しません`).not.to.be.empty;
    for (const hotel of hotels) {
      const plans = app.elements.plans(hotel);
      expect(plans, _`要件を満たすプランIDの要素が存在しません`).not.to.be.empty;
      for (const plan of plans) {
        const planId = plan.id.match(/plan-(\d+)/)[1];
        const planReserveId = `#plan-reserve-${planId}`
        const planReserve = plan.querySelectorAll(planReserveId);
        expect(planReserve, _`#${plan.id} の子要素として ${planReserveId} が 1 つのみ存在すべきですが、 ${planReserve.length} つ存在します`).to.have.lengthOf(1);
      }
    }
  });

  it(_`[Step 4] 予約ボタンをクリックした際に #message が表示される`, async () => {
    await app.tokenCheck();

    await app.search({
      keyword: "",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: true,
    });

    const hotels = app.elements.hotels();
    expect(hotels, _`要件を満たすホテルIDの要素が存在しません`).not.to.be.empty;
    for (const hotel of hotels) {
      const plans = app.elements.plans(hotel);
      expect(plans, _`要件を満たすプランIDの要素が存在しません`).not.to.be.empty;
      for (const plan of plans) {
        const planId = plan.id.match(/plan-(\d+)/)[1];
        const planReserve = app.elements.planReserve(plan, planId);
        expect(planReserve, _`要件を満たす予約ボタンの要素が存在しません`).not.to.be.empty;
        await app._click(planReserve);
        await u.ms(1000);

        const message = app.elements.message();
        expect(message, _`予約ボタンクリック後、#message が存在しません`).to.exist;
        break;
      }
      break;
    }
  });

  it(_`[Step 4] 予約ボタンをクリックして予約に成功した際、#message に予約IDを含む予約に成功した旨が表示される`, async () => {
    await app.tokenCheck();

    await app.search({
      keyword: "",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: true,
    });

    const hotels = app.elements.hotels();
    expect(hotels, _`要件を満たすホテルIDの要素が存在しません`).not.to.be.empty;
    let expectedId = 1;
    for (const hotel of hotels) {
      const plans = app.elements.plans(hotel);
      expect(plans, _`要件を満たすプランIDの要素が存在しません`).not.to.be.empty;
      for (const plan of plans) {
        const planId = plan.id.match(/plan-(\d+)/)[1];
        const planReserve = app.elements.planReserve(plan, planId);
        expect(planReserve, _`要件を満たす予約ボタンの要素が存在しません`).not.to.be.empty;
        await app._click(planReserve);
        await u.ms(2000);

        const message = app.elements.message();
        expect(message, _`予約ボタンクリック後、#message が存在しません`).to.exist;
        const reserveText = message.textContent;
        expect(reserveText, _`#message 内部に予約IDである "${expectedId}" が含まれません`).to.include("" + expectedId);
        expectedId++;
        if (expectedId == 5) {
          break;
        }
      }
      if (expectedId == 5) {
        break;
      }
    }
  });

  it(_`[Step 4] #message に予約成功時に message-success クラス、予約失敗時に message-error クラスが付与されている`, async () => {
    await app.tokenCheck();

    for (const test of reserves) {
      if (test.input.require_search) {
        await app.search({
          keyword: test.input.keyword,
          prefecture: test.input.prefecture,
          checkin: u.getDate(test.input.checkin),
          checkout: u.getDate(test.input.checkout),
          number: test.input.number,
          advanced: true,
        });
      }

      // 予約が埋まっている場合、レスポンスに表示されないので埋める必要がある
      if (test.input.full_reserve) {
        while (true) {
          const res = await got.post(`${app.server}/reservations`, {
            responseType: "json",
            headers: {
              "X-ACCESS-TOKEN": app.token,
            },
            throwHttpErrors: false,
            json: {
              checkin: u.getDate(test.input.checkin),
              checkout: u.getDate(test.input.checkout),
              plan_id: test.input.planId,
              number: test.input.number,
            },
          });
          if (res.statusCode !== 200) {
            break;
          }
        }
      }

      const planReserve = app.dom.window.document.querySelector(`button#plan-reserve-${test.input.planId}`);
      expect(planReserve, _`#plan-reserve-${test.input.planId} が存在しません`).to.exist;
      await app._click(planReserve);
      await u.ms(2000);
      const message = app.elements.message();
      expect(message, _`予約ボタンクリック後、#message が存在しません`).to.exist;
      expect(message.className, _`#message のクラスに ${test.output.class} が含まれません`).to.include(test.output.class);
      const shouldNotClass = message.className.includes("message-success") ? "message-error" : "message-success";
      expect(message.className, _`#message のクラスに ${shouldNotClass} が含まれています`).not.to.include(shouldNotClass);
    }
  });

  it(_`[Step 4] 予約ボタンをクリックして予約を行う際、適切にリクエストが送信されている`, async () => {
    await app.tokenCheck();
    await app.search({
      keyword: "",
      prefecture: 12,
      checkin: u.getDate(0),
      checkout: u.getDate(1),
      number: 2,
      advanced: true,
    });
    const hotels = app.elements.hotels();
    expect(hotels, _`要件を満たすホテルIDの要素が存在しません`).not.to.be.empty;
    for (const hotel of hotels) {
      const plans = app.elements.plans(hotel);
      expect(plans, _`要件を満たすプランIDの要素が存在しません`).not.to.be.empty;
      for (const plan of plans) {
        const planId = plan.id.match(/plan-(\d+)/)[1];
        const planReserve = app.elements.planReserve(plan, planId);
        expect(planReserve, _`要件を満たす予約ボタンの要素が存在しません`).not.to.be.empty;
        await app._click(planReserve);
        await u.ms(2000);
        break;
      }
      break;
    }

    const stat = await app.stats();
    const paths = Object.keys(stat.stat).filter(path => path.match("POST /hotel-reservation/reservations"));
    expect(paths, _`/hotels の API 呼び出しがされていません`).not.to.be.empty;
  });
});
