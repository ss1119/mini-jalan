import React from "react";
import Hotel from "./Hotel";
import InfiniteScroll from "react-infinite-scroller";

const SearchResult = (props) => {
  if (props.hotels === []) {
    return <></>;
  }
  console.log(props.hotels);
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
  return (
    <div>
      <InfiniteScroll
        pageStart={0}
        loadMore={props.loadMore}
        hasMore={props.hasMore}
      >
        {hotels}
      </InfiniteScroll>
    </div>
  );
};

export default SearchResult;
