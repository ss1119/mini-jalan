import "./App.css";
import React, { useState } from "react";
import { Container } from "react-bootstrap";
import Header from "./components/Header";
import Search from "./components/Search";

function App() {
  const uuid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
      .split("")
      .map((c) => {
        switch (c) {
          case "x":
            return ((Math.random() * 16) | 0).toString(16);
          case "y":
            return (((Math.random() * 4) | 0) + 8).toString(16);
          default:
            return c;
        }
      })
      .join("");
  };
  const [token, setToken] = useState(uuid());
  const onHeaderAccess = (token) => {
    setToken(token);
  };
  return (
    <Container>
      <Header onAccess={onHeaderAccess} token={token} />
      <Search token={token} />
    </Container>
  );
}

export default App;
