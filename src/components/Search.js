import React, { useState, useEffect } from "react";
import { Button, Row, Col, Form, Container } from "react-bootstrap";
import axios from "../lib/axios";
import SearchResult from "./SearchResult";
import Option from "./parts/Option";
import CheckBox from "./parts/CheckBox";
import ReservationResultDialog from "./parts/ReservationResultDialog";
import { prefectures } from "../utils/prefecture";
import { getToday, getXDaysLater, getStayDays } from "../utils/date";

const Search = (props) => {
  const today = getToday();
  const [keyword, setKeyword] = useState("");
  const [prefecture, setPrefecture] = useState(0);
  const [checkin, setCheckin] = useState(today);
  const [checkout, setCheckout] = useState(getXDaysLater(today, 1));
  const [number, setNumber] = useState(2);
  const [searchedNumber, setSearchedNumber] = useState(0);
  const [searchedStayDays, setSearchedStayDays] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [reservation, setReservation] = useState([]);
  const [dialogShow, setDialogShow] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    // 検索した人数および宿泊日数を保持
    setSearchedNumber(number);
    setSearchedStayDays(getStayDays(checkin, checkout));

    const query = new URLSearchParams({
      keyword: keyword,
      prefecture: prefecture,
      checkin: checkin,
      checkout: checkout,
      number: number,
    });
    await axios
      .get(`/hotels?${query}`, {
        headers: {
          "X-ACCESS-TOKEN": props.token,
        },
      })
      .then((res) => {
        setHotels(res.data);
      })
      .catch(() => {
        throw `Invalid token: ${props.token}`;
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
                <Col md="auto">
                  <CheckBox name="温泉" />
                </Col>
                <Col md="auto">
                  <CheckBox name="パーキング無料" />
                </Col>
                <Col md="auto">
                  <CheckBox name="禁煙部屋" />
                </Col>
                <Col md="auto">
                  <CheckBox name="喫煙部屋" />
                </Col>
                <Col md="auto">
                  <CheckBox name="バス・トイレ付" />
                </Col>
                <Col md="auto">
                  <CheckBox name="朝食付" />
                </Col>
                <Col md="auto">
                  <CheckBox name="夕食付" />
                </Col>
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
      />
    </>
  );
};

export default Search;
