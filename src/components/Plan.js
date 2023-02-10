import React from "react";
import { Button } from "react-bootstrap";

const Plan = (props) => {
  return (
    <tr id={"plan-" + props.plan.id}>
      <td id={"plan-name-" + props.plan.id}>{props.plan.name}</td>
      <td id={"plan-room-" + props.plan.id}>{props.room.name}</td>
      <td id={"plan-price-" + props.plan.id}>{props.plan.price}</td>
      <td id={"plan-total-price-" + props.plan.id}>
        {props.plan.price * props.number * props.stayDays}
      </td>
      <td>
        <button
          id={"plan-reserve-" + props.plan.id}
          onClick={() => {
            props.onReserveClick(props.plan.id);
          }}
          className="block w-20 text-white bg-blue-600 py-2 rounded-md border border-blue"
        >
          予約
        </button>
      </td>
    </tr>
  );
};

export default Plan;
