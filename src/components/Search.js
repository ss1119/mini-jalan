import React, { useState, useEffect } from "react";
import { Button, Row, Col, Form, Container } from "react-bootstrap";
import axios from "../lib/axios";
import SearchResult from "./SearchResult";
import Option from "./parts/Option";
import Loading from "./parts/Loading";
import CheckBoxList from "./parts/CheckBoxList";
import ReservationResultDialog from "./parts/ReservationResultDialog";
import { prefectures } from "../utils/prefecture";
import { checkList } from "../utils/checkList";
import { getToday, getXDaysLater, getStayDays } from "../utils/date";

const Search = (props) => {
  const rows = 10; // 取得するホテルの最大件数
  const today = getToday(); // 今日の日付
  const [keyword, setKeyword] = useState(""); // 入力されているキーワード
  const [prefecture, setPrefecture] = useState(0); // 入力されている都道府県
  const [checkin, setCheckin] = useState(today); // 入力されているチェックイン日
  const [checkout, setCheckout] = useState(getXDaysLater(today, 1)); // 入力されているチェックアウト日
  const [number, setNumber] = useState(2); // 入力されている宿泊人数
  const [searchedNumber, setSearchedNumber] = useState(0); // 検索した宿泊人数
  const [searchedStayDays, setSearchedStayDays] = useState(0); // 検索した宿泊期間
  const [checkedItems, setCheckedItems] = useState({}); // チェックボックスのチェック状態を管理
  const [isValid, setIsValid] = useState(false); // 検索条件のバリデーションが通っているか
  const [hotels, setHotels] = useState([]); // 検索したホテル
  const [reservation, setReservation] = useState([]); // 予約内容
  const [dialogShow, setDialogShow] = useState(false); // ダイアログ表示の制御
  const [isSuccess, setIsSuccess] = useState(false); // 予約が完了したかどうか
  const [isLoading, setIsLoading] = useState(false); // ローディングの制御
  const [hasMore, setHasMore] = useState(false); // 次に読み込む検索結果があるか
  const [lastHotelId, setLastHotelId] = useState(""); // 取得した最後のホテルのID

  const options = prefectures.map((value, index) => {
    return <Option key={index} index={index} name={value} />;
  });

  const onKeywordChange = (value) => {
    setKeyword(value);
  };

  const onPrefectureChange = (value) => {
    setPrefecture(value);
  };

  const onCheckinChange = (value) => {
    setCheckin(value);
  };

  const onCheckoutChange = (value) => {
    setCheckout(value);
  };

  const onNumberChange = (value) => {
    setNumber(value);
  };

  // フォームの値が変更されるたびにバリデーションを行う
  useEffect(() => {
    checkValid();
  }, [prefecture, checkin, checkout, number]);

  // チェックボックスの値が変わった時にstateを更新
  const handleCheckChange = (e) => {
    setCheckedItems({
      ...checkedItems,
      [e.target.id - 1]: e.target.checked,
    });
  };

  // 検索条件のバリエーション
  const checkValid = () => {
    if (
      1 <= prefecture &&
      prefecture <= 47 &&
      checkin >= today &&
      checkout > checkin &&
      getStayDays(checkin, checkout) <= 6 &&
      number >= 1
    ) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const onSearchClick = async () => {
    setIsLoading(true);

    // 検索した人数および宿泊日数を保持
    setSearchedNumber(number);
    setSearchedStayDays(getStayDays(checkin, checkout));

    // 詳細条件
    const condition = Object.keys(checkedItems)
      .flatMap((key) => {
        return checkedItems[key] ? checkList[key].value : [];
      })
      .join(",");

    const query = new URLSearchParams({
      keyword: keyword,
      prefecture: "",
      checkin: checkin,
      checkout: checkout,
      number: number,
      condition: condition,
      rows: rows,
    });
    await axios
      .get(`/hotels?${query}`, {
        headers: {
          "X-ACCESS-TOKEN": props.token,
        },
      })
      .then((res) => {
        setHotels(res.data);
        if (res.data.length === rows) {
          setHasMore(true);
          setLastHotelId(res.data[res.data.length - 1].id);
        } else {
          setHasMore(false);
        }
      })
      .catch(() => {
        throw `Invalid token: ${props.token}`;
      });
  };

  // 検索結果を読み込む時のコールバック
  const loadMore = async () => {
    // 詳細条件
    const condition = Object.keys(checkedItems)
      .flatMap((key) => {
        return checkedItems[key] ? checkList[key].value : [];
      })
      .join(",");

    const query = new URLSearchParams({
      keyword: keyword,
      prefecture: "",
      checkin: checkin,
      checkout: checkout,
      number: number,
      condition: condition,
      rows: rows,
      after: lastHotelId,
    });
    await axios
      .get(`/hotels?${query}`, {
        headers: {
          "X-ACCESS-TOKEN": props.token,
        },
      })
      .then((res) => {
        setHotels([...hotels, ...res.data]);
        if (res.data.length === rows) {
          setHasMore(true);
          setLastHotelId(res.data[res.data.length - 1].id);
        } else {
          setHasMore(false);
        }
      })
      .catch(() => {
        throw `Invalid token: ${props.token}`;
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onReserveClick = async (planId) => {
    const body = {
      checkin: checkin,
      checkout: checkout,
      plan_id: planId,
      number: number,
    };
    await axios
      .post("/reservations", body, {
        headers: {
          "X-ACCESS-TOKEN": props.token,
        },
      })
      .then((res) => {
        setReservation(res.data);
        setIsSuccess(true);
        setDialogShow(true);
      })
      .catch(() => {
        setIsSuccess(false);
        setDialogShow(true);
      });
  };

  return (
    <>
      <Loading isLoading={isLoading} />
      <ReservationResultDialog
        isSuccess={isSuccess}
        show={dialogShow}
        onHide={() => setDialogShow(false)}
        reservation={reservation}
      />
      <Container>
        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Keyword</Form.Label>
              <Form.Control
                type="text"
                id="keyword"
                onChange={(e) => onKeywordChange(e.target.value)}
              />
              <br />
              <Row>
                <Col md="auto">
                  <Form.Label>Prefecture</Form.Label>
                  <Form.Select
                    id="prefecture"
                    defaultValue={prefecture}
                    onChange={(e) => onPrefectureChange(e.target.value)}
                  >
                    {options}
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Form.Label>Checkin</Form.Label>
                  <Form.Control
                    type="date"
                    id="checkin"
                    defaultValue={checkin}
                    min={today}
                    onChange={(e) => onCheckinChange(e.target.value)}
                  />
                </Col>
                <Col md="auto">
                  <Form.Label>Checkout</Form.Label>
                  <Form.Control
                    type="date"
                    id="checkout"
                    defaultValue={checkout}
                    min={getXDaysLater(checkin, 1)}
                    max={getXDaysLater(checkin, 6)}
                    onChange={(e) => onCheckoutChange(e.target.value)}
                  />
                </Col>
                <Col md="auto">
                  <Form.Label>Number</Form.Label>
                  <Form.Control
                    type="number"
                    id="number"
                    defaultValue={number}
                    min="1"
                    onChange={(e) => onNumberChange(e.target.value)}
                  />
                </Col>
              </Row>
              <br />
              <Row>
                <CheckBoxList
                  checkList={checkList}
                  checkedItems={checkedItems}
                  handleChange={handleCheckChange}
                />
              </Row>
            </Form.Group>
          </Col>
          <Col md="auto">
            <Button
              type="submit"
              id="search"
              disabled={!isValid}
              onClick={onSearchClick}
            >
              Search
            </Button>
          </Col>
        </Row>
      </Container>
      <br />
      <SearchResult
        hotels={hotels}
        number={searchedNumber}
        stayDays={searchedStayDays}
        onReserveClick={onReserveClick}
        loadMore={loadMore}
        hasMore={hasMore}
      />
    </>
  );
};

export default Search;
