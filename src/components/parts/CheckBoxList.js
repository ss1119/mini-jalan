import { Row, Col, Form } from "react-bootstrap";

const CheckBoxList = (props) => {
  return props.checkList.map((item, index) => {
    index++;
    return (
      <Col key={index} md="auto">
        <Row>
          <Col md="auto">
            <Form.Check
              id={index}
              type="checkbox"
              value={item}
              checked={props.checkedItems[item.id]}
              onChange={(e) => props.handleChange(e)}
            />
          </Col>
          <Col>
            <Form.Label>{item.name}</Form.Label>
          </Col>
        </Row>
      </Col>
    );
  });
};

export default CheckBoxList;
