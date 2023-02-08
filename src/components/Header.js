import { Button, Navbar, Form } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import Axios from "../lib/axios";

const Header = (props) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isInputDisabled, setIsInputDisabled] = useState(false);

  const onTokenCheckClick = () => {
    setIsButtonDisabled(true);
    setIsInputDisabled(true);
    Axios.get("/token-check", {
      headers: {
        "X-ACCESS-TOKEN": props.token,
      },
    });
  };

  const onAccessTokenChenged = (value) => {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    if (regex.test(value)) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
    props.onAccess(value);
  };

  useEffect(() => {
    onAccessTokenChenged(props.token);
  }, []);

  return (
    <Navbar>
      <Navbar.Brand href="#home">ミニじゃらん</Navbar.Brand>
      <Form.Control
        id="access_token"
        type="text"
        value={props.token}
        disabled={isInputDisabled}
        onChange={(e) => onAccessTokenChenged(e.target.value)}
      />
      <Button
        id="token_check"
        variant="primary"
        disabled={isButtonDisabled}
        onClick={onTokenCheckClick}
      >
        Access
      </Button>
    </Navbar>
  );
};

export default Header;
