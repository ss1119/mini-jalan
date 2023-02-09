import React from "react";
import Hotel from "./Hotel";
import InfiniteScroll from "react-infinite-scroller";
import { Spinner } from "react-bootstrap";

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
  const loader = (
    <div className="flex justify-center items-center mt-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
  return (
    <div>
      <InfiniteScroll
        pageStart={0}
        loadMore={props.loadMore}
        hasMore={props.hasMore}
        loader={loader}
      >
        {hotels}
      </InfiniteScroll>
    </div>
  );
};

export default SearchResult;
