import { Row, Col, Form } from "react-bootstrap";

const CheckBox = (props) => {
  return (
    <Row>
      <Col md="auto">
        <Form.Check type="checkbox" />
      </Col>
      <Col>
        <Form.Label>{props.name}</Form.Label>
      </Col>
    </Row>
  );
};

export default CheckBox;
