import axios from "axios";

const Axios = axios.create({
  baseURL: "https://track-challenge-api-labrat.herokuapp.com/hotel-reservation",
});

export default Axios;
