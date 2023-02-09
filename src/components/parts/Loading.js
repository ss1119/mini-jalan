import Modal from "react-modal";
import { Spinner } from "react-bootstrap";

const Loading = (props) => {
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(0, 0, 0, 0)",
      border: "rgba(0, 0, 0, 0)",
    },
  };

  return (
    <Modal isOpen={props.isLoading} style={customStyles} ariaHideApp={false}>
      <Spinner animation="border" />
    </Modal>
  );
};

export default Loading;
