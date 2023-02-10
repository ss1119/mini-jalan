import { Modal } from "react-bootstrap";

const ReservationResultDialog = (props) => {
  return (
    <Modal {...props} centered>
      <div
        id="message"
        className={props.isSuccess ? "message-success" : "message-error"}
      >
        {props.isSuccess ? (
          <>
            <Modal.Header closeButton>
              <Modal.Title>予約が完了しました</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h4>予約内容</h4>
              <ul>
                <li>{"予約ID：" + props.reservation.id}</li>
                <li>{"予約人数：" + props.reservation.number}</li>
                <li>
                  {"宿泊期間：" +
                    props.reservation.checkin +
                    "〜" +
                    props.reservation.checkout}
                </li>
              </ul>
            </Modal.Body>
          </>
        ) : (
          <Modal.Body closeButton>
            <Modal.Title>予約ができませんでした</Modal.Title>
          </Modal.Body>
        )}
      </div>
      <Modal.Footer>
        <button
          onClick={props.onHide}
          className="block w-20 text-white bg-blue-600 py-2 rounded-md border border-blue"
        >
          閉じる
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReservationResultDialog;
