import React from "react";
import Hotel from "./Hotel";

const SearchResult = (props) => {
  if (props.hotels === []) {
    return <></>;
  }
  const hotels = props.hotels.map((hotel) => {
    return (
      <Hotel
        key={hotel.id}
        hotel={hotel}
        number={props.number}
        stayDays={props.stayDays}
        onReserveClick={props.onReserveClick}
      />
    );
  });
  return <>{hotels}</>;
};

export default SearchResult;
