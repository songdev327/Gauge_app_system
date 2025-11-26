import "./index.css"
function ModalQCInspection(props) {
    // กำหนด default class ให้เป็น modal-dialog ตาม Bootstrap
    let modalSize = "modal-dialog";
  
    // ถ้าผู้ใช้ส่ง props.modalSize เข้ามา ให้ต่อคลาสเข้าไป
    if (props.modalSize) {
      modalSize += " " + props.modalSize;
    }
  
    const closeModal = () => {
      window.location.reload();
    };
  
    return (
      <>
        <div
          className="modal"
          id={props.id}
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className={modalSize}>
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title" id="exampleModalLabel">
                  {props.title}
                </h1>
                <button
                  onClick={closeModal}
                  type="button"
                  className="btn-close btn-close-large"
                  data-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">{props.children}</div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  export default ModalQCInspection;
  