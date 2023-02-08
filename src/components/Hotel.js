import React from "react";
import { Accordion, Table } from "react-bootstrap";
import Plan from "./Plan";

const Hotel = (props) => {
  const plans = props.hotel.plans.map((plans) => {
    return plans.map((plan) => {
      const room = props.hotel.rooms.find((room) => room.id === plan.room_id);
      return (
        <Plan
          key={plan.id}
          plan={plan}
          room={room}
          number={props.number}
          stayDays={props.stayDays}
          onReserveClick={props.onReserveClick}
        />
      );
    });
  });
  return (
    <Accordion defaultActiveKey="0">
      <Accordion.Item id={"hotel-" + props.hotel.id} eventKey="1">
        <Accordion.Header id={"hotel-name-" + props.hotel.id}>
          {props.hotel.name}
        </Accordion.Header>
        <Accordion.Body>
          <p id={"hotel-address-" + props.hotel.id}>{props.hotel.address}</p>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>name</th>
                <th>room</th>
                <th>price</th>
                <th>total-price</th>
                <th>reserve</th>
              </tr>
            </thead>
            <tbody>{plans}</tbody>
          </Table>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default Hotel;
