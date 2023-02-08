export const getToday = () => {
  const today = new Date();
  today.setDate(today.getDate());
  const yyyy = today.getFullYear();
  const mm = ("0" + (today.getMonth() + 1)).slice(-2);
  const dd = ("0" + today.getDate()).slice(-2);
  return yyyy + "-" + mm + "-" + dd;
};

export const getXDaysLater = (date, x) => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + x);
  const yyyy = nextDay.getFullYear();
  const mm = ("0" + (nextDay.getMonth() + 1)).slice(-2);
  const dd = ("0" + nextDay.getDate()).slice(-2);
  return yyyy + "-" + mm + "-" + dd;
};

export const getStayDays = (checkin, checkout) => {
  const checkinDay = new Date(checkin);
  const checkoutDay = new Date(checkout);

  // 差日の計算（86,400,000ミリ秒＝１日）
  const stayDays = (checkoutDay - checkinDay) / 86400000;
  return stayDays;
};
